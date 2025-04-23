// @/lib/deepseek-api.ts
import { formatNumber } from './github-api';

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
  stars: string;
  forks: string;
  pullRequests: string;
  issuesCount: string;
  issues: string[];
  language: string | null;
  ownerAvatar: string;
  owner: string;
  contributors: any[];
  topics: string[];
  homepage: string | null;
  createdAt: string;
  updatedAt: string;
  license: string | null;
  size: number;
  readme: string | null;
  defaultBranch: string;
}

// This is a mock function that would actually connect to Deepseek in a real implementation
export async function getRecommendedRepositories(
  userPreferences: UserPreferences,
  count = 5,
  githubToken?: string | null
): Promise<Repository[]> {
  // This would be a real API call to Deepseek
  // For now, we'll simulate by filtering repositories
  
  try {
    // Import GitHub API functions
    const { searchRepositories, processRepositoriesData, checkRateLimit, GitHubRateLimitError } = await import('./github-api');
    
    // Check rate limit first with token
    const hasQuota = await checkRateLimit(githubToken);
    if (!hasQuota) {
      throw new GitHubRateLimitError();
    }
    
    // Build a query based on user preferences
    let query = "";
    
    // Add languages
    if (userPreferences.preferredLanguages.length > 0) {
      userPreferences.preferredLanguages.slice(0, 3).forEach(lang => {
        query += `language:${lang.toLowerCase()} `;
      });
    }
    
    // Add topics based on interests
    if (userPreferences.interests.length > 0) {
      // Map interests to GitHub topics
      const interestToTopic: Record<string, string> = {
        "Web Development": "web",
        "Mobile Apps": "mobile",
        "Data Science": "data-science",
        "Machine Learning": "machine-learning",
        "Game Development": "game",
        "DevOps": "devops",
        "Security": "security",
        "Backend": "backend",
        "Frontend": "frontend",
        "UI/UX": "ui",
        "Cloud Computing": "cloud",
        "Blockchain": "blockchain",
        "IoT": "iot",
        "AR/VR": "ar-vr"
      };
      
      userPreferences.interests.slice(0, 2).forEach(interest => {
        if (interestToTopic[interest]) {
          query += `topic:${interestToTopic[interest]} `;
        }
      });
    }
    
    // Add skill level considerations
    if (userPreferences.skillLevel === "beginner") {
      query += "good-first-issues:>0 ";
    }
    
    // Add considerations based on what they're looking for
    if (userPreferences.looking.includes("Documentation")) {
      query += "topic:documentation ";
    }
    
    if (userPreferences.looking.includes("Beginner Friendly")) {
      query += "topic:beginner-friendly ";
    }
    
    if (userPreferences.looking.includes("Open Source Projects")) {
      query += "is:public ";
    }
    
    // If query is still empty, use a default
    if (!query.trim()) {
      query = "stars:>100";
    }
    
    // Add default sorting and ensure we get active projects
    query += "sort:stars";
    
    // Perform the search with token
    const repos = await searchRepositories(query.trim(), 1, githubToken);
    
    // Check for rate limit again before processing (which makes multiple API calls)
    const stillHasQuota = await checkRateLimit(githubToken);
    if (!stillHasQuota) {
      throw new GitHubRateLimitError();
    }
    
    // Process the results (limit to 5 to reduce API calls) with token
    return await processRepositoriesData(repos.slice(0, 5), {
      userToken: githubToken
    });
  } catch (error) {
    console.error("Error getting Deepseek recommendations:", error);
    return [];
  }
}

// Generate a personalized explanation for why a repository is recommended
export function getRecommendationReason(
  repo: Repository,
  userPreferences: UserPreferences
): string {
  const reasons = [];
  
  // Check language match
  if (repo.language && userPreferences.preferredLanguages.includes(repo.language)) {
    reasons.push(`Uses ${repo.language}, one of your preferred languages`);
  }
  
  // Check topic match with interests
  const interestKeywords: Record<string, string[]> = {
    "Web Development": ["web", "frontend", "backend", "javascript", "html", "css"],
    "Mobile Apps": ["mobile", "android", "ios", "flutter", "react-native"],
    "Data Science": ["data", "analytics", "visualization", "pandas", "jupyter"],
    "Machine Learning": ["ml", "machine-learning", "ai", "tensorflow", "pytorch"],
    "Game Development": ["game", "unity", "gamedev", "unreal"],
    "DevOps": ["devops", "ci-cd", "docker", "kubernetes", "automation"],
    "Security": ["security", "crypto", "authentication", "authorization"],
    "Backend": ["backend", "api", "database", "server"],
    "Frontend": ["frontend", "ui", "ux", "interface"],
    "UI/UX": ["ui", "ux", "design", "interface"],
    "Cloud Computing": ["cloud", "aws", "azure", "gcp"],
    "Blockchain": ["blockchain", "crypto", "web3", "ethereum"],
    "IoT": ["iot", "embedded", "hardware", "sensors"],
    "AR/VR": ["ar", "vr", "augmented-reality", "virtual-reality"]
  };
  
  for (const interest of userPreferences.interests) {
    const keywords = interestKeywords[interest] || [];
    const matchingTopics = repo.topics.filter(topic => 
      keywords.some(keyword => topic.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    if (matchingTopics.length > 0) {
      reasons.push(`Matches your interest in ${interest}`);
      break;
    }
  }
  
  // Check for beginner friendliness
  if (userPreferences.skillLevel === "beginner" && 
      repo.topics.some(topic => topic.includes("beginner") || topic.includes("good-first-issue"))) {
    reasons.push("Beginner-friendly with labeled issues");
  }
  
  // Check for documentation
  if (userPreferences.looking.includes("Documentation") && 
      repo.topics.some(topic => topic.includes("documentation") || topic.includes("docs"))) {
    reasons.push("Has well-maintained documentation");
  }
  
  // Check for size and complexity
  if (userPreferences.skillLevel === "beginner" && repo.size < 50000) {
    reasons.push("Smaller codebase, easier to understand");
  }
  
  // Add popularity reason if the repo has many stars
  const starsNum = parseInt(repo.stars.replace('k', '000').replace('M', '000000'));
  if (starsNum > 1000) {
    reasons.push(`Popular with ${repo.stars} stars`);
  }
  
  // If all else fails, provide a generic reason
  if (reasons.length === 0) {
    reasons.push("Matches your overall profile");
  }
  
  return reasons.slice(0, 2).join(". ");
}