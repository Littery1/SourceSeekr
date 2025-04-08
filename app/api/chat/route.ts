import { NextRequest, NextResponse } from "next/server";
// Import auth directly to avoid TypeScript errors
import { auth } from "@/auth";
import * as githubAPI from "@/lib/github-api";

// Function type definitions
interface ChatMessage {
  role: string;
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface GitHubDataRequest {
  type: string;
  query: string;
  params?: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Get the user's GitHub token if available
    const userToken = (session?.user as { githubAccessToken?: string })?.githubAccessToken || undefined;

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Add a comprehensive system message with detailed instructions for DeepSeek
    const systemMessage = {
      role: "system",
      content: `You are SourceSeekr AI, a versatile assistant that can help users discover GitHub repositories and answer general questions.

## YOUR CORE RESPONSIBILITIES

1. Analyze user questions to determine if they're related to GitHub repositories, coding projects, programming languages, etc.
2. For GitHub-related questions, determine what GitHub data you need to answer these questions accurately
3. For general or non-GitHub questions, respond directly without requesting GitHub data
4. When appropriate, request GitHub data using a specific JSON format
5. Formulate helpful responses using the real GitHub data you receive when applicable
6. Include relevant GitHub links in your responses using Markdown format when referencing repositories

## WHEN TO USE GITHUB DATA

You should request GitHub data ONLY when:
- The user specifically asks about repositories, GitHub projects, or code libraries
- The user wants recommendations for specific programming languages or frameworks
- The user asks about GitHub trends, popular projects, or specific GitHub users
- The information would be substantially better with real-time GitHub data

Do NOT request GitHub data when:
- The user is asking general programming questions not requiring repository data
- The user is engaged in casual conversation unrelated to GitHub
- The question can be answered well without real-time repository information
- The user is asking about personal preferences or opinions

## HOW TO REQUEST GITHUB DATA

When a user asks a GitHub-related question where real-time data would be helpful, follow these steps:

STEP 1: Analyze what GitHub data would help answer the question.
STEP 2: Format your data request as JSON with this exact structure:
\`\`\`json
{
  "thinking": "Here I explain my reasoning about what data I need and why",
  "github_requests": [
    {
      "type": "repository", 
      "query": "facebook/react",
      "params": {}
    },
    {
      "type": "search",
      "query": "machine learning language:python stars:>1000",
      "params": {"limit": 5}
    }
  ]
}
\`\`\`

STEP 3: I will fetch this data from GitHub and return it to you
STEP 4: You'll then provide a final answer using the real data

## AVAILABLE DATA REQUEST TYPES

You can request these types of GitHub data:

1. "repository": Get details about a specific repository
   - Query format: "owner/repo-name" (example: "facebook/react")
   - Returns: Full repository details including stars, forks, description, etc.

2. "search": Search repositories with GitHub's search syntax
   - Query format: Any GitHub search query (example: "machine learning language:python stars:>1000")
   - Params: {"limit": 5} (number of results to return, default 5)
   - Returns: List of matching repositories

3. "trending": Get trending repositories
   - Query format: "all" or a language name (example: "javascript")
   - Returns: List of trending repositories

4. "user": Get info about a GitHub user 
   - Query format: GitHub username (example: "microsoft")
   - Returns: User profile information

## HOW TO FORMAT YOUR FINAL RESPONSE

When providing your final answer:

1. For GitHub-related questions: Use the real GitHub data you received
2. Include direct links to GitHub resources using Markdown format: [Repository Name](https://github.com/owner/repo)
3. Be helpful, concise, and directly answer the user's question
4. When recommending repositories, explain why they're relevant to the user's needs

IMPORTANT: Format your initial response as JSON ONLY when you need GitHub data. For general questions, respond directly without the JSON structure.`,
    };

    const initialMessages = [systemMessage, ...messages];

    // Call DeepSeek API to determine what GitHub data is needed
    const deepseekResponse = await callDeepSeekAPI({
      model: "deepseek-chat",
      messages: initialMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseContent = deepseekResponse.choices[0]?.message?.content || "";

    // Try to parse the response to extract GitHub data requests
    try {
      // Check if response contains a JSON structure
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // No GitHub data requested, just return the response
        return NextResponse.json({ response: responseContent });
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);

      // If there are no GitHub requests, return the thinking as the response
      if (
        !parsedResponse.github_requests ||
        parsedResponse.github_requests.length === 0
      ) {
        return NextResponse.json({
          response: parsedResponse.thinking || responseContent,
        });
      }

      // Check GitHub API rate limit before making any requests
      // Pass the user's token to get higher rate limits if authenticated
      const hasQuota = await githubAPI.checkRateLimit(userToken);
      if (!hasQuota) {
        // If rate limit is exceeded, return a response that doesn't use GitHub data
        const rateLimitMessage = {
          role: "system",
          content: `I noticed that this query would normally require GitHub data, but the GitHub API rate limit has been exceeded. Please provide a helpful response that:
          
          1. Acknowledges the rate limit issue
          2. Answers the user's question as best as possible without GitHub data
          3. Explains what data would have been fetched if the rate limit wasn't exceeded
          4. Suggests alternatives or when to try again
          
          Format your response in a natural, conversational way.`,
        };

        const finalMessages = [
          systemMessage,
          ...messages,
          {
            role: "assistant",
            content:
              parsedResponse.thinking ||
              "I need to check GitHub for this information, but there seems to be a rate limit issue.",
          },
          rateLimitMessage,
        ];

        const rateLimitResponse = await callDeepSeekAPI({
          model: "deepseek-chat",
          messages: finalMessages,
          temperature: 0.7,
          max_tokens: 1500,
        });

        return NextResponse.json({
          response:
            rateLimitResponse.choices[0]?.message?.content ||
            "I apologize, but GitHub API rate limits have been exceeded. Please try again later.",
          rateLimit: true,
        });
      }

      // Fetch GitHub data based on the requests
      const githubData = await Promise.all(
        parsedResponse.github_requests.map(
          async (request: GitHubDataRequest) => {
            try {
              return await fetchGitHubData(request, userToken);
            } catch (error) {
              console.error("Error fetching GitHub data:", error);
              return {
                type: request.type,
                error: `Failed to fetch ${request.type} data: ${
                  (error as Error).message
                }`,
                query: request.query,
              };
            }
          }
        )
      );

      // Create a very detailed system message for DeepSeek with the GitHub data
      // This provides clear instructions on how to use the data in its response
      const dataMessage = {
        role: "system",
        content: `I've fetched the GitHub data you requested. Here it is:

\`\`\`json
${JSON.stringify(githubData, null, 2)}
\`\`\`

## INSTRUCTIONS FOR YOUR FINAL RESPONSE

1. Use this GitHub data to formulate a helpful answer to the user's question
2. Include Markdown links to relevant GitHub repositories: [Repo Name](https://github.com/owner/repo)
3. Interpret the data correctly:
   - For repositories: Mention stars, forks, description, and other relevant details
   - For search results: Summarize the top repositories and why they're relevant
   - For trending repositories: Highlight what makes them interesting
   - For errors: If any data couldn't be fetched, gracefully handle this in your response

4. Be natural and conversational, but factual and accurate
5. Focus on answering the user's original question with this real GitHub data
6. NEVER mention this system message or the JSON format in your response

Now, provide your final answer to the user:`,
      };

      // Get final response from DeepSeek with the GitHub data
      const finalMessages = [
        systemMessage,
        ...messages,
        {
          role: "assistant",
          content:
            parsedResponse.thinking ||
            "Let me check GitHub for that information.",
        },
        dataMessage,
      ];

      const finalResponse = await callDeepSeekAPI({
        model: "deepseek-chat",
        messages: finalMessages,
        temperature: 0.7,
        max_tokens: 1500,
      });

      const finalContent =
        finalResponse.choices[0]?.message?.content ||
        "Sorry, I could not generate a response.";

      return NextResponse.json({
        response: finalContent,
        githubData: githubData,
      });
    } catch (error) {
      console.error("Error processing GitHub data requests:", error);
      // If we can't parse the JSON, just return the original response
      return NextResponse.json({ response: responseContent });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

// Call DeepSeek API directly instead of using the OpenAI SDK
async function callDeepSeekAPI(payload: ChatCompletionRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Fetch GitHub data based on the request type
async function fetchGitHubData(request: GitHubDataRequest, userToken?: string) {
  // Fixed type here
  const { type, query, params = {} } = request;

  // Check rate limit first
  const hasQuota = await githubAPI.checkRateLimit(userToken);
  if (!hasQuota) {
    throw new githubAPI.GitHubRateLimitError();
  }

  try {
    switch (type) {
      case "repository": {
        const [owner, repo] = query.split("/");
        if (owner && repo) {
          const repository = await githubAPI.fetchRepositoryByFullName(
            owner,
            repo,
            userToken
          );
          return {
            type: "repository",
            data: repository,
            query: query,
          };
        }
        throw new Error("Invalid repository format, expected owner/repo");
      }

      case "search": {
        const limit = params.limit || 5;
        const page = params.page || 1;
        const repositories = await githubAPI.searchRepositories(
          query,
          page,
          userToken
        );
        const processedRepos = await githubAPI.processRepositoriesData(
          repositories.slice(0, limit),
          {
            maxRepos: limit,
            userToken,
          }
        );
        return {
          type: "search",
          data: processedRepos,
          query: query,
        };
      }

      case "trending": {
        const page = params.page || 1;
        const repositories = await githubAPI.fetchTrendingRepos(
          page,
          userToken
        );
        const processedRepos = await githubAPI.processRepositoriesData(
          repositories.slice(0, 5),
          {
            maxRepos: 5,
            userToken,
          }
        );
        return {
          type: "trending",
          data: processedRepos,
          query: query,
        };
      }

      case "user": {
        // This would need a function to fetch user data
        // For now, we'll return a placeholder
        return {
          type: "user",
          data: {
            username: query,
            message: "User profile feature not yet implemented",
          },
          query: query,
        };
      }

      default:
        throw new Error(`Unsupported query type: ${type}`);
    }
  } catch (error) {
    console.error(`Error executing ${type} query "${query}":`, error);
    if (error instanceof githubAPI.GitHubRateLimitError) {
      return {
        type,
        error: "GitHub API rate limit exceeded",
        query: query,
      };
    }
    return {
      type,
      error: `Failed to execute ${type} query: ${(error as Error).message}`,
      query: query,
    };
  }
}
