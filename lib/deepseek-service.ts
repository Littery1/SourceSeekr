// @/lib/deepseek-service.ts
import OpenAI from 'openai';

interface UserPreferences {
  interests: string[];
  skillLevel: string;
  looking: string[];
  preferredLanguages: string[];
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  issues: number;
  language: string | null;
  ownerAvatar: string;
  owner: string;
  topics: string[];
  homepage: string | null;
  createdAt: Date;
  updatedAt: Date;
  license: string | null;
  size: number;
  url: string;
}

interface GitHubUserProfile {
  username: string;
  name?: string;
  bio?: string;
  followers?: number;
  following?: number;
  popularRepos?: {
    name: string;
    language: string;
    stars: number;
    description?: string;
  }[];
  languages?: {
    language: string;
    percentage: number;
  }[];
  contributions?: {
    language: string;
    count: number;
  }[];
}

// Initialize OpenAI client with DeepSeek configuration
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com/v1',
});

/**
 * Get personalized repository recommendations using the DeepSeek API
 * 
 * @param repositories List of repositories to rank
 * @param userProfile User's GitHub profile data
 * @param userPreferences User's explicit preferences set in profile page
 * @param count Number of repositories to return
 * @returns Sorted array of repositories
 */
export async function getPersonalizedRepositories(
  repositories: Repository[],
  userProfile: GitHubUserProfile | null,
  userPreferences: UserPreferences | null,
  count: number = 10
): Promise<Repository[]> {
  try {
    if (repositories.length === 0) {
      return [];
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      console.warn('DEEPSEEK_API_KEY is not set. Returning unsorted repositories.');
      return repositories.slice(0, count);
    }

    // Format repositories for the prompt
    const reposForPrompt = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      fullName: repo.fullName,
      description: repo.description,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      topics: repo.topics.join(', '),
      size: repo.size,
    }));

    // Create a system message that describes what we want
    const systemMessage = `You are an AI assistant that helps recommend GitHub repositories to users based on their profile and preferences. 
Your task is to rank the given repositories in order of relevance to the user.`;

    const userProfileText = userProfile 
      ? `
GitHub Profile:
- Username: ${userProfile.username}
${userProfile.name ? `- Name: ${userProfile.name}` : ''}
${userProfile.bio ? `- Bio: ${userProfile.bio}` : ''}
${userProfile.followers ? `- Followers: ${userProfile.followers}` : ''}
${userProfile.following ? `- Following: ${userProfile.following}` : ''}
${userProfile.popularRepos && userProfile.popularRepos.length > 0 
  ? `- Popular Repositories: ${userProfile.popularRepos.map(repo => 
    `${repo.name} (${repo.language || 'Unknown'}, ${repo.stars} stars${repo.description ? `, "${repo.description}"` : ''})`
  ).join(', ')}` 
  : ''}
${userProfile.languages && userProfile.languages.length > 0 
  ? `- Languages: ${userProfile.languages.map(lang => 
    `${lang.language} (${lang.percentage}%)`
  ).join(', ')}` 
  : ''}
${userProfile.contributions && userProfile.contributions.length > 0 
  ? `- Contributions: ${userProfile.contributions.map(contrib => 
    `${contrib.language} (${contrib.count} contributions)`
  ).join(', ')}` 
  : ''}
` 
      : '';

    const userPreferencesText = userPreferences 
      ? `
User Preferences:
- Interests: ${userPreferences.interests.length > 0 ? userPreferences.interests.join(', ') : 'Not specified'}
- Skill Level: ${userPreferences.skillLevel || 'Not specified'}
- Looking For: ${userPreferences.looking.length > 0 ? userPreferences.looking.join(', ') : 'Not specified'}
- Preferred Languages: ${userPreferences.preferredLanguages.length > 0 ? userPreferences.preferredLanguages.join(', ') : 'Not specified'}
` 
      : '';

    // Call the DeepSeek API
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemMessage },
        { 
          role: 'user', 
          content: `I need you to rank these GitHub repositories based on their relevance to the user.
${userProfileText}
${userPreferencesText}

Repositories to rank:
${JSON.stringify(reposForPrompt, null, 2)}

Return a JSON array containing only the repository IDs in ranked order (most relevant first), like this format:
[123, 456, 789]

Only include IDs from the provided repositories. Do not include explanations or other text.`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    // Parse the response to get the ranked IDs
    const responseText = completion.choices[0]?.message?.content || '{"ranked_ids": []}';
    const responseJson = JSON.parse(responseText);
    
    // Safety check for the format
    const rankedIds = Array.isArray(responseJson.ranked_ids) 
      ? responseJson.ranked_ids 
      : Object.values(responseJson)[0];
    
    if (!Array.isArray(rankedIds)) {
      console.error('Unexpected response format from DeepSeek:', responseJson);
      return repositories.slice(0, count);
    }

    // Map the ranked IDs back to the repositories
    const idToRepoMap = new Map(repositories.map(repo => [repo.id, repo]));
    const rankedRepos = rankedIds
      .map(id => idToRepoMap.get(Number(id)))
      .filter((repo): repo is Repository => repo !== undefined);
    
    // Add any repositories that weren't ranked
    const rankedIds2 = new Set(rankedIds.map(id => Number(id)));
    const unrankedRepos = repositories.filter(repo => !rankedIds2.has(repo.id));
    
    // Return the top N repositories
    return [...rankedRepos, ...unrankedRepos].slice(0, count);
  } catch (error) {
    console.error('Error getting personalized repositories from DeepSeek:', error);
    return repositories.slice(0, count);
  }
}

/**
 * Generate a personalized explanation for why a repository is recommended
 * 
 * @param repository The repository to explain
 * @param userProfile User's GitHub profile data
 * @param userPreferences User's explicit preferences set in profile page
 * @returns A personalized explanation
 */
export async function getRepositoryRecommendationReason(
  repository: Repository,
  userProfile: GitHubUserProfile | null,
  userPreferences: UserPreferences | null
): Promise<string> {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      // Fallback to the existing function if no API key is present
      const { getRecommendationReason } = await import('./deepseek-api');
      const repoForLegacy = {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        description: repository.description,
        stars: repository.stars.toString(),
        forks: repository.forks.toString(),
        pullRequests: "0",
        issuesCount: repository.issues.toString(),
        issues: [],
        language: repository.language,
        ownerAvatar: repository.ownerAvatar,
        owner: repository.owner,
        contributors: [],
        topics: repository.topics,
        homepage: repository.homepage,
        createdAt: repository.createdAt.toISOString(),
        updatedAt: repository.updatedAt.toISOString(),
        license: repository.license,
        size: repository.size,
        readme: null,
        defaultBranch: "main"
      };
      return userPreferences ? getRecommendationReason(repoForLegacy, userPreferences) : 'Trending repository';
    }

    // Format repository for the prompt
    const repoForPrompt = {
      name: repository.name,
      owner: repository.owner,
      fullName: repository.fullName,
      description: repository.description,
      language: repository.language,
      stars: repository.stars,
      forks: repository.forks,
      topics: repository.topics.join(', '),
      size: repository.size,
    };

    // Create system message
    const systemMessage = `You are an AI assistant that helps explain why a GitHub repository might be relevant to a user.
Your task is to generate a brief, personalized explanation (1-2 sentences) for why this repository matches the user's profile and preferences.`;

    const userProfileText = userProfile 
      ? `
GitHub Profile:
- Username: ${userProfile.username}
${userProfile.name ? `- Name: ${userProfile.name}` : ''}
${userProfile.bio ? `- Bio: ${userProfile.bio}` : ''}
${userProfile.languages && userProfile.languages.length > 0 
  ? `- Languages: ${userProfile.languages.map(lang => 
    `${lang.language} (${lang.percentage}%)`
  ).join(', ')}` 
  : ''}
` 
      : '';

    const userPreferencesText = userPreferences 
      ? `
User Preferences:
- Interests: ${userPreferences.interests.length > 0 ? userPreferences.interests.join(', ') : 'Not specified'}
- Skill Level: ${userPreferences.skillLevel || 'Not specified'}
- Looking For: ${userPreferences.looking.length > 0 ? userPreferences.looking.join(', ') : 'Not specified'}
- Preferred Languages: ${userPreferences.preferredLanguages.length > 0 ? userPreferences.preferredLanguages.join(', ') : 'Not specified'}
` 
      : '';

    // Call the DeepSeek API
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemMessage },
        { 
          role: 'user', 
          content: `Generate a brief (1-2 sentence) personalized explanation for why this GitHub repository matches the user's profile and preferences.
${userProfileText}
${userPreferencesText}

Repository:
${JSON.stringify(repoForPrompt, null, 2)}

Provide a simple, direct explanation without preamble. Avoid phrases like "This repository is recommended because..." and just get straight to the reason.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const reason = completion.choices[0]?.message?.content?.trim();
    return reason || 'Matches your interests and skills';
  } catch (error) {
    console.error('Error getting recommendation reason from DeepSeek:', error);
    return 'Matches your GitHub activity patterns';
  }
}