import { auth } from "@/auth";
import Header from "@/components/header";
import { Octokit } from "@octokit/core";


interface GitHubUser {
  name: string | null;
  login: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

interface Repository {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

async function fetchGitHubData(token: string): Promise<GitHubUser> {
  const octokit = new Octokit({ auth: token });

  try {
    const { data: githubData } = await octokit.request<GitHubUser>({
      method: "GET",
      url: "/user",
    });
    return githubData;
  } catch (error) {
    console.error("Error fetching GitHub user data:", (error as Error).message);
    throw error;
  }
}

async function fetchRandomRepositories(token: string): Promise<Repository[]> {
  const octokit = new Octokit({ auth: token });

  try {
    const { data: randomRepos } = await octokit.request<string>(
      "GET /repositories",
      { per_page: 10 }
    );
    return randomRepos;
  } catch (error) {
    console.error(
      "Error fetching random repositories:",
      (error as Error).message
    );
    throw error;
  }
}

async function getDeepseekRecommendations(prompt: string): Promise<string> {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content; // Adjust based on the API response structure
  } catch (error) {
    console.error(
      "Error fetching recommendations from Deepseek:",
      (error as Error).message
    );
    throw error;
  }
}

function buildPrompt(
  githubData: GitHubUser,
  randomRepos: Repository[]
): string {
  const userProfileText = `
    User's GitHub Profile:
    Name: ${githubData?.name || "Unknown"}
    Username: ${githubData?.login || "Unknown"}
    Bio: ${githubData?.bio || "No bio"}
    Public Repos: ${githubData?.public_repos || 0}
    Followers: ${githubData?.followers || 0}
  `;

  const repositoriesText = randomRepos
    .map(
      (repo) =>
        `Name: ${repo.name}, Description: ${
          repo.description || "N/A"
        }, Language: ${repo.language || "Unknown"}, Stars: ${
          repo.stargazers_count
        }, Forks: ${repo.forks_count}`
    )
    .join("; ");

  return `
    Analyze the following GitHub profile and recommend 3 repositories out of the 10 provided that the user might find interesting to contribute to, based on their interests and skills:

    ${userProfileText}

    Repositories:
    ${repositoriesText}
  `;
}

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  const githubToken = session?.accessToken;

  let githubData: GitHubUser | null = null;
  let randomRepos: Repository[] = [];
  let recommendations: string | null = null;

  if (githubToken) {
    try {
      // Fetch GitHub profile data
      githubData = await fetchGitHubData(githubToken);

      // Fetch 10 random repositories
      randomRepos = await fetchRandomRepositories(githubToken);

      // Build the prompt for Deepseek Chat
      const prompt = buildPrompt(githubData, randomRepos);

      // Get recommendations from Deepseek Chat
      recommendations = await getDeepseekRecommendations(prompt);
    } catch (error) {
      console.error("Error fetching data:", (error as Error).message);
    }
  } else {
    console.error("GitHub token is not available.");
  }

  return (
    <>
      <Header />
      <section className="bg-ct-blue-600 min-h-screen pt-20">
        <div className="max-w-4xl mx-auto bg-ct-dark-100 rounded-md h-auto flex flex-col justify-center items-center p-6">
            
          {recommendations ? (
            <div>
              <p className="mt-5">AI Recommendations: </p>
              <ul className="mt-2 p-2 bg-gray-200 rounded max-w-full overflow-auto">
                <li>
                  <pre className="whitespace-pre-wrap break-words">
                    {recommendations}
                  </pre>
                </li>
              </ul>
            </div>
          ) : (
            <p className="mt-5">No recommendations available.</p>
          )}
        </div>
      </section>
    </>
  );
}
