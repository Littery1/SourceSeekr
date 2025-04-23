  // @/lib/github-api.ts
  interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    language: string | null;
    owner: {
      login: string;
      avatar_url: string;
    };
    topics?: string[];
    homepage?: string | null;
    created_at: string;
    updated_at: string;
    license?: {
      name: string;
    } | null;
    size: number;
    default_branch: string;
    visibility?: string;
  }

  interface Contributor {
    avatar_url: string;
    contributions: number;
    login: string;
  }

  interface GitHubIssue {
    title: string;
    number: number;
    state: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    user: {
      login: string;
      avatar_url: string;
    };
    comments: number;
  }

  interface ReadmeContent {
    content: string;
    encoding: string;
  }

  export interface ProcessedRepo {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    stars: string;
    forks: string;
    pullRequests: string;
    issuesCount: string;
    issues: { title: string; number: number; html_url: string }[];
    language: string | null;
    ownerAvatar: string;
    owner: string;
    contributors: Contributor[];
    topics: string[];
    homepage: string | null;
    createdAt: string;
    updatedAt: string;
    license: string | null;
    size: number;
    readme: string | null;
    defaultBranch: string;
  }
  // Constants
  const BANNED_KEYWORDS = ["nazi", "racist", "hate"];
  const REPOS_PER_PAGE = 10;
  const MAX_CACHE_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Track API calls for debugging purposes
  const apiCallStats = {
    totalCalls: 0,
    byEndpoint: {} as Record<string, number>,
    lastReset: Date.now(),
    
    trackCall(endpoint: string) {
      this.totalCalls++;
      this.byEndpoint[endpoint] = (this.byEndpoint[endpoint] || 0) + 1;
      console.log(`GitHub API call to ${endpoint}. Total: ${this.totalCalls}`);
    },
    
    getStats() {
      return {
        totalCalls: this.totalCalls,
        byEndpoint: { ...this.byEndpoint },
        sinceTime: new Date(this.lastReset).toISOString()
      };
    },
    
    reset() {
      this.totalCalls = 0;
      this.byEndpoint = {};
      this.lastReset = Date.now();
    }
  };

  // Cache structure
  interface CacheItem<T> {
    data: T;
    timestamp: number;
  }

  interface RepoCache {
    popular: Record<number, CacheItem<GitHubRepo[]>>;
    trending: Record<number, CacheItem<GitHubRepo[]>>;
    byId: Record<string, CacheItem<ProcessedRepo>>;
    byFullName: Record<string, CacheItem<ProcessedRepo>>;
    searchResults: Record<string, CacheItem<GitHubRepo[]>>;
  }

  // Initialize the cache
  const repoCache: RepoCache = {
    popular: {},
    trending: {},
    byId: {},
    byFullName: {},
    searchResults: {},
  };

  // Helper function to check if cache is valid
  function isCacheValid<T>(cache: CacheItem<T> | undefined): boolean {
    if (!cache) return false;
    return Date.now() - cache.timestamp < MAX_CACHE_AGE;
  }

  // Cache rate limit info to reduce API calls
  let lastRateLimitCheck = 0;
  let remainingRequests = 5000;
  const RATE_LIMIT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Verify if a GitHub token is valid and has the required scopes
   * @param token GitHub token to validate
   * @returns Object with validation results
   */
  export async function verifyGitHubToken(token: string): Promise<{
    valid: boolean;
    user?: string;
    scopes?: string[];
    error?: string;
  }> {
    try {
      if (!token) {
        return { valid: false, error: "No token provided" };
      }

      // Use the user endpoint to verify token and get scopes
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "SourceSeekr-App"
        }
      });

      // Get scopes from response header
      const scopesHeader = response.headers.get("X-OAuth-Scopes");
      const scopes = scopesHeader ? scopesHeader.split(", ") : [];

      if (response.status === 401) {
        return { valid: false, error: "Invalid or expired token" };
      }

      if (!response.ok) {
        return { 
          valid: false, 
          error: `GitHub API error: ${response.status} ${response.statusText}`
        };
      }

      const userData = await response.json();
      
      return {
        valid: true,
        user: userData.login,
        scopes
      };
    } catch (error) {
      console.error("Error validating GitHub token:", error);
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  // API rate limit handling with caching
  export async function checkRateLimit(userToken?: string | null): Promise<boolean> {
    try {
      const now = Date.now();
      // Only check rate limit once every 5 minutes, unless we're getting low
      if (now - lastRateLimitCheck > RATE_LIMIT_CACHE_DURATION || remainingRequests < 20) {
        console.log("Checking GitHub rate limit via API");
        
        // On the client-side, use our API endpoint to avoid CORS issues
        if (typeof window !== 'undefined') {
          try {
            const res = await fetch("/api/github/rate-limit");
            if (!res.ok) {
              console.error("Error checking rate limit via proxy API:", res.status);
              return false;
            }
            const data = await res.json();
            if (!data.success) {
              return false;
            }
            remainingRequests = 100; // Arbitrary number since we don't get the actual count
            lastRateLimitCheck = now;
            return data.hasQuota;
          } catch (err) {
            console.error("Failed to check rate limit via proxy:", err);
            return false;
          }
        } else {
          // Server-side direct API call
          const res = await fetch("https://api.github.com/rate_limit", {
            headers: getHeaders(userToken)
          });
          
          if (!res.ok) {
            // If unauthorized, assume we can't make requests
            if (res.status === 401 || res.status === 403) {
              console.error("GitHub authentication error during rate limit check:", res.status);
              return false;
            }
            throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
          }
          
          const data = await res.json();
          remainingRequests = data.resources.core.remaining;
          lastRateLimitCheck = now;
          console.log(`GitHub API rate limit: ${remainingRequests} requests remaining`);
        }
      } else {
        // Decrement our cached count each time to be conservative
        remainingRequests -= 1;
      }
      return remainingRequests > 10;
    } catch (error) {
      console.error("Error checking rate limit:", error);
      return false;
    }
  }

  // Error classes for different GitHub API issues
  export class GitHubRateLimitError extends Error {
    constructor(message = "GitHub API rate limit exceeded. Please try again later.") {
      super(message);
      this.name = "GitHubRateLimitError";
    }
  }

  export class GitHubAuthError extends Error {
    constructor(message = "GitHub API authentication failed. Please login again.") {
      super(message);
      this.name = "GitHubAuthError";
    }
  }

  export class GitHubApiError extends Error {
    public status: number;
    
    constructor(status: number, message: string) {
      super(message);
      this.name = "GitHubApiError";
      this.status = status;
    }
  }

  /**
   * Handle errors from GitHub API responses
   * @param response Fetch response from GitHub API
   * @throws GitHubAuthError, GitHubRateLimitError, or GitHubApiError based on the response
   */
  export async function handleGitHubApiResponse(response: Response): Promise<Response> {
    if (response.ok) {
      return response;
    }
    
    // Handle different error cases
    if (response.status === 401) {
      throw new GitHubAuthError("Authentication failed. Your GitHub token may have expired. Please login again.");
    }
    
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      
      // Check if it's a rate limit issue
      if (rateLimitRemaining === "0") {
        const resetTime = response.headers.get("X-RateLimit-Reset");
        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleTimeString() : "unknown time";
        throw new GitHubRateLimitError(`GitHub API rate limit exceeded. Limit resets at ${resetDate}.`);
      }
      
      // Check if it's an OAuth scope issue
      const scopes = response.headers.get("X-OAuth-Scopes");
      if (scopes === "") {
        throw new GitHubAuthError("Your GitHub token doesn't have the required permissions. Please login again to grant access.");
      }
      
      // Other 403 errors
      throw new GitHubApiError(403, "GitHub API access forbidden. You may not have permission to access this resource.");
    }
    
    if (response.status === 404) {
      throw new GitHubApiError(404, "GitHub resource not found.");
    }
    
    // Default error for other status codes
    throw new GitHubApiError(
      response.status,
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  /**
   * Safe API call with rate limit and authentication checks
   * @param apiCall Function that makes the API call
   * @param userToken Optional user token for authentication
   * @returns Promise with the API call result
   */
  export async function safeGitHubApiCall<T>(
    apiCall: () => Promise<T>, 
    userToken?: string | null
  ): Promise<T> {
    // Check rate limit first
    const hasQuota = await checkRateLimit(userToken);
    if (!hasQuota) {
      throw new GitHubRateLimitError();
    }
    
    try {
      return await apiCall();
    } catch (error) {
      // Re-throw GitHub specific errors
      if (
        error instanceof GitHubRateLimitError ||
        error instanceof GitHubAuthError ||
        error instanceof GitHubApiError
      ) {
        throw error;
      }
      
      // Log and wrap other errors
      console.error("GitHub API call failed:", error);
      throw new GitHubApiError(
        500, 
        `Unexpected error during GitHub API call: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Get headers with authorization if token exists
  // Update the getHeaders function
  export function getHeaders(userToken?: string | null): HeadersInit {
    // Try to use the user's GitHub token first, if available from their session
    // Fall back to the app's token from environment variables
    const token = userToken || process.env.GITHUB_TOKEN;
    
    const headers: HeadersInit = {
      // Always include required headers according to GitHub API docs
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'SourceSeekr-App'
    };
    
    if (token) {
      // Modern Bearer token authentication format
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Fetch popular repositories based on stars, with optional query and filters
   */
  export async function fetchQualityRepos(page = 1, query: string = '', beginnerFriendly: boolean = false, userToken?: string): Promise<GitHubRepo[]> {
    // Create a cache key based on parameters
    const cacheKey = `${query}_${beginnerFriendly ? 'beginner' : 'all'}_${page}`;
    
    // Create a structure for storing different query results
    if (!repoCache.popular[page]) {
      repoCache.popular[page] = {};
    }
    
    // Return cached repos if available and valid
    if (repoCache.popular[page][cacheKey] && isCacheValid(repoCache.popular[page][cacheKey])) {
      return repoCache.popular[page][cacheKey].data;
    }

    // Check rate limit first with user token
    const hasQuota = await checkRateLimit(userToken);
    if (!hasQuota) {
      throw new Error("GitHub API rate limit exceeded");
    }

    // Build search query, starting with simpler default
    let searchQuery = 'stars:>50';
    
    // If a custom query is provided, use it instead of the default
    if (query && query.trim() !== '') {
      searchQuery = query.trim();
    }
    
    // Ensure the query doesn't get too complex - GitHub API has limitations
    let queryParts = [];
    
    // Only add language if specified and no language already in the query
    if (!searchQuery.includes('language:')) {
      // Use language filter from preferences or current filter
      let language = 'javascript';
      
      try {
        // If the user has preferences in localStorage, use those instead
        if (typeof window !== 'undefined') {
          const savedPreferences = localStorage.getItem('sourceseekr-preferences');
          if (savedPreferences) {
            const prefs = JSON.parse(savedPreferences);
            if (prefs.preferredLanguages && prefs.preferredLanguages.length > 0) {
              language = prefs.preferredLanguages[0].toLowerCase();
            }
          }
        }
      } catch (e) {
        console.error('Error parsing preferences:', e);
      }
      
      // Create a clean query with minimal complexity
      queryParts.push(searchQuery);
      queryParts.push(`language:${language}`);
    } else {
      // Keep the query as is if it already has language specification
      queryParts.push(searchQuery);
    }
    
    // Add beginner-friendly filter if requested and not already in query
    if (beginnerFriendly && !searchQuery.includes('good-first-issues')) {
      queryParts.push('good-first-issues:>0');
    }
    
    // Combine query parts
    const finalQuery = queryParts.join(' ');
    console.log("GitHub search query:", finalQuery);
    
    // Make the API request
    try {
      // When on client-side, use our proxy API to avoid CORS issues
      let res;
      if (typeof window !== 'undefined') {
        // Use our proxy API on client-side
        res = await fetch(`/api/github/repos?q=${encodeURIComponent(finalQuery)}&page=${page}`, {
          credentials: 'include'
        });
      } else {
        // Direct API call on server-side
        res = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(finalQuery)}&sort=stars&order=desc&per_page=${REPOS_PER_PAGE}&page=${page}`,
          { headers: getHeaders(userToken) }
        );
      }
      
      if (!res.ok) {
        console.error(`GitHub API error: ${res.status} ${res.statusText}`);
        
        // If query is complex and fails, try a simpler fallback query
        if (finalQuery.split(' ').length > 2) {
          // Fallback to a very simple query
          const simpleFallback = 'stars:>100';
          console.log("Trying simpler fallback query:", simpleFallback);
          
          // Retry with simpler query
          if (typeof window !== 'undefined') {
            res = await fetch(`/api/github/repos?q=${encodeURIComponent(simpleFallback)}&page=${page}`, {
              credentials: 'include'
            });
          } else {
            res = await fetch(
              `https://api.github.com/search/repositories?q=${encodeURIComponent(simpleFallback)}&sort=stars&order=desc&per_page=${REPOS_PER_PAGE}&page=${page}`,
              { headers: getHeaders(userToken) }
            );
          }
          
          if (!res.ok) {
            // If even the fallback fails, throw error
            throw new Error(`Failed to fetch repositories with fallback query: ${res.status} ${res.statusText}`);
          }
        } else {
          throw new Error(`Failed to fetch repositories: ${res.status} ${res.statusText}`);
        }
      }
      
      // Parse the response
      const data = await res.json();
      const items = typeof window !== 'undefined' ? data.repositories : data.items;
      
      const filteredRepos = (items || []).filter(
        (repo: GitHubRepo) =>
          !BANNED_KEYWORDS.some(
            (keyword) =>
              repo.name.toLowerCase().includes(keyword) ||
              (repo.description?.toLowerCase() || "").includes(keyword)
          )
      );
      
      // Create cache structure for this page if needed
      if (!repoCache.popular[page]) {
        repoCache.popular[page] = {};
      }
      
      // Cache the results with the query-specific key
      repoCache.popular[page][cacheKey] = {
        data: filteredRepos,
        timestamp: Date.now(),
      };
      
      return filteredRepos;
    } catch (error) {
      console.error("Error fetching repositories:", error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Fetch trending repositories (created in the last month)
   */
  export async function fetchTrendingRepos(page = 1, userToken?: string): Promise<GitHubRepo[]> {
    // Return cached repos if available and valid
    if (repoCache.trending[page] && isCacheValid(repoCache.trending[page])) {
      return repoCache.trending[page].data;
    }

    // Check rate limit first with user token
    const hasQuota = await checkRateLimit(userToken);
    if (!hasQuota) {
      throw new Error("GitHub API rate limit exceeded");
    }

    // Fetch trending repositories (created in the last month with stars)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const dateQuery = oneMonthAgo.toISOString().split("T")[0];

    const res = await fetch(
      `https://api.github.com/search/repositories?q=created:>${dateQuery}+is:public+stars:>20+has:issues&sort=stars&order=desc&per_page=${REPOS_PER_PAGE}&page=${page}`,
      { headers: getHeaders(userToken) }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch trending repositories: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    const filteredRepos = (data.items || []).filter(
      (repo: GitHubRepo) =>
        !BANNED_KEYWORDS.some(
          (keyword) =>
            repo.name.toLowerCase().includes(keyword) ||
            (repo.description?.toLowerCase() || "").includes(keyword)
        )
    );

    // Cache the results
    repoCache.trending[page] = {
      data: filteredRepos,
      timestamp: Date.now(),
    };

    return filteredRepos;
  }

  /**
   * Search repositories by keyword
   */
  export async function searchRepositories(query: string, page = 1, userToken?: string): Promise<GitHubRepo[]> {
    // Sanitize input
    if (!query || query.trim() === '') {
      return [];
    }
    
    const cacheKey = `${query.toLowerCase()}_${page}`;
    
    // Return cached results if available and valid
    if (repoCache.searchResults[cacheKey] && isCacheValid(repoCache.searchResults[cacheKey])) {
      return repoCache.searchResults[cacheKey].data;
    }

    // Check rate limit first with user token
    const hasQuota = await checkRateLimit(userToken);
    if (!hasQuota) {
      throw new Error("GitHub API rate limit exceeded");
    }

    // Apply user preferences if query doesn't already have language specifications
    let enhancedQuery = query;
    if (!query.includes('language:') && typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('sourceseekr-preferences');
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        if (prefs.preferredLanguages && prefs.preferredLanguages.length > 0) {
          const firstLanguage = prefs.preferredLanguages[0].toLowerCase();
          enhancedQuery += ` language:${firstLanguage}`;
        }
        
        // Add skill level considerations
        if (prefs.skillLevel === "beginner" && !query.includes('good-first-issues')) {
          enhancedQuery += " good-first-issues:>0";
        }
      }
    }
    
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(enhancedQuery.trim())}+is:public&sort=stars&order=desc&per_page=${REPOS_PER_PAGE}&page=${page}`,
      { headers: getHeaders(userToken) }
    );

    if (!res.ok) {
      throw new Error(`Failed to search repositories: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    const filteredRepos = (data.items || []).filter(
      (repo: GitHubRepo) =>
        !BANNED_KEYWORDS.some(
          (keyword) =>
            repo.name.toLowerCase().includes(keyword) ||
            (repo.description?.toLowerCase() || "").includes(keyword)
        )
    );

    // Cache the results
    repoCache.searchResults[cacheKey] = {
      data: filteredRepos,
      timestamp: Date.now(),
    };

    return filteredRepos;
  }

  /**
   * Fetch the complete repository information by owner and name
   */
  export async function fetchRepositoryByFullName(owner: string, name: string, userToken?: string): Promise<ProcessedRepo | null> {
    const fullName = `${owner}/${name}`;
    
    // Return cached repo if available and valid
    if (repoCache.byFullName[fullName] && isCacheValid(repoCache.byFullName[fullName])) {
      return repoCache.byFullName[fullName].data;
    }

    return await safeGitHubApiCall(async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${fullName}`,
          { headers: getHeaders(userToken) }
        );
        
        // Handle potential API errors (auth, rate limit, etc.)
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          await handleGitHubApiResponse(res);
        }

        const repo: GitHubRepo = await res.json();
        const processedRepo = await processRepositoryData(repo, userToken);

        // Cache the results
        repoCache.byFullName[fullName] = {
          data: processedRepo,
          timestamp: Date.now(),
        };
        repoCache.byId[repo.id.toString()] = {
          data: processedRepo,
          timestamp: Date.now(),
        };

        return processedRepo;
      } catch (error) {
        // Only log the error if it's not one of our known API errors
        if (!(error instanceof GitHubAuthError) && 
            !(error instanceof GitHubRateLimitError) && 
            !(error instanceof GitHubApiError)) {
          console.error(`Error fetching repository ${fullName}:`, error);
        }
        
        // Re-throw to let callers handle specific error types
        throw error;
      }
    }, userToken);
  }

  /**
   * Fetch repository by ID
   */
  export async function fetchRepositoryById(id: number, userToken?: string): Promise<ProcessedRepo | null> {
    const idStr = id.toString();
    
    // Return cached repo if available and valid
    if (repoCache.byId[idStr] && isCacheValid(repoCache.byId[idStr])) {
      return repoCache.byId[idStr].data;
    }

    try {
      // Check rate limit first
      const hasQuota = await checkRateLimit();
      if (!hasQuota) {
        throw new Error("GitHub API rate limit exceeded");
      }

      const res = await fetch(
        `https://api.github.com/repositories/${id}`,
        { headers: getHeaders(userToken) }
      );

      if (!res.ok) {
        if (res.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch repository: ${res.status} ${res.statusText}`);
      }

      const repo: GitHubRepo = await res.json();
      const processedRepo = await processRepositoryData(repo);

      // Cache the results
      repoCache.byId[idStr] = {
        data: processedRepo,
        timestamp: Date.now(),
      };
      repoCache.byFullName[repo.full_name] = {
        data: processedRepo,
        timestamp: Date.now(),
      };

      return processedRepo;
    } catch (error) {
      console.error(`Error fetching repository with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Fetch repository contributors
   */
  export async function fetchContributors(
    owner: string,
    repo: string,
    limit = 10,
    userToken?: string
  ): Promise<Contributor[]> {
    try {
      const hasQuota = await checkRateLimit();
      if (!hasQuota) return [];

      // For client-side requests, use our proxy API
      if (typeof window !== 'undefined') {
        try {
          const res = await fetch(`/api/github/contributors?owner=${owner}&repo=${repo}&limit=${limit}`, {
            credentials: 'include'
          });
          
          if (!res.ok) {
            console.error(`Error fetching contributors via proxy: ${res.status}`);
            return [];
          }
          
          const data = await res.json();
          return data.contributors || [];
        } catch (err) {
          console.error("Failed to fetch contributors via proxy:", err);
          return [];
        }
      } else {
        // Server-side direct API call
        try {
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${limit}`,
            { headers: getHeaders(userToken) }
          );
          
          if (!res.ok) {
            console.error(`Error fetching contributors directly: ${res.status}`);
            return [];
          }
          
          return await res.json();
        } catch (err) {
          console.error("Failed to fetch contributors directly:", err);
          return [];
        }
      }
    } catch (error) {
      console.error("Error fetching contributors:", error);
      return [];
    }
  }

  export async function fetchRepoIssues(
    owner: string,
    repo: string,
    limit = 5,
    userToken?: string
  ): Promise<{ title: string; number: number; html_url: string }[]> {
    try {
      const hasQuota = await checkRateLimit();
      if (!hasQuota) return [];

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=${limit}`,
        { headers: getHeaders(userToken) }
      );

      if (!res.ok) return [];
      const data = await res.json();
      return data.map((issue: GitHubIssue) => ({
        title: issue.title,
        number: issue.number,
        html_url: issue.html_url,
      }));
    } catch (error) {
      console.error("Error fetching issues:", error);
      return [];
    }
  }

  /**
   * Fetch pull request count
   */
  export async function fetchRepoPullRequests(
    owner: string,
    repo: string,
    userToken?: string
  ): Promise<number> {
    try {
      const hasQuota = await checkRateLimit();
      if (!hasQuota) return 0;

      // Safer approach - some repositories might be restricted or private
      // Just return a default value instead of making a potentially error-prone call
      return 0;
      
      // Original implementation has permission issues (403 errors)
      /*
      const res = await fetch(
        `https://api.github.com/search/issues?q=repo:${owner}/${repo}+is:pr`,
        { headers: getHeaders(userToken) }
      );
      
      if (!res.ok) return 0;
      const data = await res.json();
      return data.total_count;
      */
    } catch (error) {
      console.error("Error fetching pull requests:", error);
      return 0;
    }
  }

  /**
   * Fetch repository readme
   */
  export async function fetchRepoReadme(
    owner: string,
    repo: string,
    userToken?: string
  ): Promise<string> {
    try {
      const hasQuota = await checkRateLimit();
      if (!hasQuota) return "";

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers: getHeaders(userToken) }
      );
      
      if (!res.ok) return "";
      
      const data: ReadmeContent = await res.json();
      return atob(data.content);
    } catch (error) {
      console.error("Error fetching readme:", error);
      return "";
    }
  }

  /**
   * Fetch similar repositories based on language and topics
   */
  export async function fetchSimilarRepositories(
    language: string | null, 
    topics: string[],
    excludeRepo: string,
    limit = 3,
    userToken?: string
  ): Promise<GitHubRepo[]> {
    try {
      const hasQuota = await checkRateLimit();
      if (!hasQuota) return [];
      
      // Build a simpler query to avoid 400 errors
      let query = "stars:>10";
      
      // Add only the language for simplicity - using too many qualifiers leads to 422 errors
      if (language) {
        query += `+language:${language}`;
      }
      
      // Add just one topic to the query if available to keep it simple
      if (topics.length > 0) {
        // Use only the first topic for more reliable results
        const firstTopic = topics[0];
        query += `+topic:${firstTopic}`;
      }
      
      // Make the API request
      try {
        // When on client-side, use our proxy API to avoid CORS issues
        let res;
        if (typeof window !== 'undefined') {
          // Use our proxy API on client-side
          res = await fetch(`/api/github/repos?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`, {
            credentials: 'include'
          });
        } else {
          // Direct API call on server-side
          res = await fetch(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
            { headers: getHeaders(userToken) }
          );
        }
        
        if (!res.ok) {
          console.error(`GitHub API error fetching similar repos: ${res.status} ${res.statusText}`);
          
          // Try an even simpler fallback query if the first one fails
          const fallbackQuery = language ? `language:${language}+stars:>50` : 'stars:>100';
          
          // Retry with simpler query
          if (typeof window !== 'undefined') {
            res = await fetch(`/api/github/repos?q=${encodeURIComponent(fallbackQuery)}&per_page=${limit}`, {
              credentials: 'include'
            });
          } else {
            res = await fetch(
              `https://api.github.com/search/repositories?q=${encodeURIComponent(fallbackQuery)}&sort=stars&order=desc&per_page=${limit}`,
              { headers: getHeaders(userToken) }
            );
          }
          
          if (!res.ok) return [];
        }
        
        // Parse the response
        const data = await res.json();
        const items = typeof window !== 'undefined' ? data.repositories : data.items;
        
        // Filter out the current repository if it's somehow in the results
        return (items || []).filter((repo: GitHubRepo) => 
          repo.full_name !== excludeRepo
        );
      } catch (error) {
        console.error("Error in fetch for similar repositories:", error);
        return [];
      }
    } catch (error) {
      console.error("Error fetching similar repositories:", error);
      return [];
    }
  }

  // GraphQL implementation for fetching repository data
  async function fetchRepositoryDataWithGraphQL(owner: string, name: string, userToken?: string): Promise<any> {
    return await safeGitHubApiCall(async () => {
      // Use the user's token if provided, otherwise use the app's token
      const token = userToken || process.env.GITHUB_TOKEN;
      if (!token) {
        throw new GitHubAuthError("GitHub token is required for GraphQL API");
      }
      
      const query = `
        query {
          repository(owner: "${owner}", name: "${name}") {
            id
            name
            description
            stargazerCount
            forkCount
            openIssues: issues(states: OPEN) {
              totalCount
              nodes(first: 5) {
                title
                number
                url
              }
            }
            pullRequests {
              totalCount
            }
            primaryLanguage {
              name
            }
            owner {
              login
              avatarUrl
            }
            mentionableUsers(first: 10) {
              nodes {
                login
                avatarUrl
                contributionsCollection(repositoryId: $repoId: "${owner}/${name}") {
                  contributionCount
                }
              }
            }
            repositoryTopics(first: 20) {
              nodes {
                topic {
                  name
                }
              }
            }
            homepageUrl
            createdAt
            updatedAt
            licenseInfo {
              name
            }
            diskUsage
            defaultBranchRef {
              name
            }
            object(expression: "HEAD:README.md") {
              ... on Blob {
                text
              }
            }
          }
        }
      `;
      
      try {
        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "SourceSeekr-App",
            "X-GitHub-Api-Version": "2022-11-28"
          },
          body: JSON.stringify({ query }),
        });
        
        // Handle potential API errors
        if (!response.ok) {
          await handleGitHubApiResponse(response);
        }
        
        const data = await response.json();
        
        // GraphQL can return 200 OK with errors in the response body
        if (data.errors) {
          const errorMessage = data.errors.map((e: any) => e.message).join(', ');
          
          // Check for authentication errors in the messages
          if (errorMessage.includes("authentication") || errorMessage.includes("token")) {
            throw new GitHubAuthError(`GitHub GraphQL API authentication error: ${errorMessage}`);
          }
          
          throw new GitHubApiError(400, `GitHub GraphQL API error: ${errorMessage}`);
        }
        
        if (!data.data?.repository) {
          return null;
        }
        
        return data.data.repository;
      } catch (error) {
        // Only log if it's not one of our known API errors
        if (!(error instanceof GitHubAuthError) && 
            !(error instanceof GitHubRateLimitError) && 
            !(error instanceof GitHubApiError)) {
          console.error(`Error fetching repository data with GraphQL for ${owner}/${name}:`, error);
        }
        
        // Re-throw to let callers handle it
        throw error;
      }
    }, userToken);
  }

  /**
   * Process a GitHub repository into our application's format
   */
  export async function processRepositoryData(
    repo: GitHubRepo,
    userToken?: string
  ): Promise<ProcessedRepo> {
    const [owner, repoName] = repo.full_name.split("/");

    // Check rate limit first
    const hasQuota = await checkRateLimit();
    if (!hasQuota) {
      throw new GitHubRateLimitError();
    }

    // Set default values for additional data to avoid showing empty state if API calls fail
    let contributors: Contributor[] = [];
    let issues: { title: string; number: number; html_url: string }[] = [];
    let pullRequests = 0;
    let readme = "";
    
    // Try to use GraphQL for efficiency if token is available (1 request instead of 5)
    if (userToken || process.env.GITHUB_TOKEN) {
      try {
        const graphqlData = await fetchRepositoryDataWithGraphQL(owner, repoName, userToken);
        
        if (graphqlData) {
          // Transform GraphQL data to our application format
          return {
            id: repo.id,
            name: graphqlData.name,
            fullName: `${owner}/${repoName}`,
            description: graphqlData.description || null,
            stars: formatNumber(graphqlData.stargazerCount),
            forks: formatNumber(graphqlData.forkCount),
            pullRequests: formatNumber(graphqlData.pullRequests.totalCount),
            issuesCount: formatNumber(graphqlData.openIssues.totalCount),
            issues: graphqlData.openIssues.nodes.map((issue: any) => issue.title),
            language: graphqlData.primaryLanguage?.name || null,
            ownerAvatar: graphqlData.owner.avatarUrl,
            owner: graphqlData.owner.login,
            contributors: graphqlData.mentionableUsers.nodes
              .filter((user: any) => user.contributionsCollection?.contributionCount > 0)
              .map((user: any) => ({
                login: user.login,
                avatar_url: user.avatarUrl,
                contributions: user.contributionsCollection?.contributionCount || 0
              }))
              .sort((a: any, b: any) => b.contributions - a.contributions),
            topics: graphqlData.repositoryTopics.nodes.map((topic: any) => topic.topic.name),
            homepage: graphqlData.homepageUrl || null,
            createdAt: graphqlData.createdAt,
            updatedAt: graphqlData.updatedAt,
            license: graphqlData.licenseInfo?.name || null,
            size: graphqlData.diskUsage || repo.size,
            readme: graphqlData.object?.text || "",
            defaultBranch: graphqlData.defaultBranchRef?.name || "main",
          };
        }
      } catch (error) {
        console.error(`GraphQL fetch failed for ${repo.full_name}, falling back to REST API:`, error);
        // If GraphQL fails, continue with REST API approach
      }
    }

    // Fallback to REST API with minimal data fetching
    try {
      // For rate limit protection, we'll fetch these in sequence rather than parallel
      // This reduces the chance of hitting the rate limit all at once

      // Only fetch contributors for repos with significant stars to reduce API calls
      if (repo.stargazers_count > 100) {
        try {
          contributors = await fetchContributors(owner, repoName, 10, userToken);
        } catch (error) {
          if (
            error instanceof GitHubRateLimitError ||
            (error instanceof Error &&
              error.message.includes("rate limit exceeded"))
          ) {
            throw error; // Re-throw rate limit errors to stop further processing
          }
          console.error(
            `Error fetching contributors for ${repo.full_name}:`,
            error
          );
        }
      }
      // When initializing at the beginning of the function:
      let issues: { title: string; number: number; html_url: string }[] = [];

      // In the REST API section where you handle issues:
      if (repo.open_issues_count > 0) {
        try {
          issues = await fetchRepoIssues(owner, repoName, 5, userToken);
        } catch (error) {
          if (
            error instanceof GitHubRateLimitError ||
            (error instanceof Error &&
              error.message.includes("rate limit exceeded"))
          ) {
            throw error; // Re-throw rate limit errors to stop further processing
          }
          console.error(`Error fetching issues for ${repo.full_name}:`, error);
        }
      }

      // Only fetch PRs for popular repos
      if (repo.stargazers_count > 500) {
        try {
          pullRequests = await fetchRepoPullRequests(owner, repoName, userToken);
        } catch (error) {
          if (
            error instanceof GitHubRateLimitError ||
            (error instanceof Error &&
              error.message.includes("rate limit exceeded"))
          ) {
            throw error; // Re-throw rate limit errors to stop further processing
          }
          console.error(
            `Error fetching pull requests for ${repo.full_name}:`,
            error
          );
        }
      }

      // Skip readme fetching entirely unless it's absolutely needed
      // This is typically the heaviest API call and consumes the most resources
      // Most UIs don't show the full readme immediately anyway
    } catch (error) {
      console.error(`Error processing details for ${repo.full_name}:`, error);
      // If it's a rate limit error, re-throw so it can be handled upstream
      if (error instanceof GitHubRateLimitError || 
          (error instanceof Error && error.message.includes("rate limit exceeded"))) {
        throw error;
      }
    }

    // Format the data for our application
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || null,
      stars: formatNumber(repo.stargazers_count),
      forks: formatNumber(repo.forks_count),
      pullRequests: formatNumber(pullRequests),
      issuesCount: formatNumber(repo.open_issues_count),
      issues,
      language: repo.language,
      ownerAvatar: repo.owner.avatar_url,
      owner: repo.owner.login,
      contributors: contributors.sort((a, b) => b.contributions - a.contributions),
      topics: repo.topics || [],
      homepage: repo.homepage || null,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      license: repo.license?.name || null,
      size: repo.size,
      readme,
      defaultBranch: repo.default_branch,
    };
  }

  /**
   * Format large numbers for display
   */
  export function formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  }

  /**
   * Format file size for display
   */
  export function formatFileSize(sizeInKB: number): string {
    if (sizeInKB >= 1000000) {
      return `${(sizeInKB / 1000000).toFixed(1)} GB`;
    } else if (sizeInKB >= 1000) {
      return `${(sizeInKB / 1000).toFixed(1)} MB`;
    }
    return `${sizeInKB} KB`;
  }

  /**
   * Format date for display
   */
  export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Clear the cache (useful when implementing refresh functionality)
   */
  export function clearRepoCache(): void {
    repoCache.popular = {};
    repoCache.trending = {};
    repoCache.byId = {};
    repoCache.byFullName = {};
    repoCache.searchResults = {};
  }

  /**
   * Batch process a list of repositories to get full details
   * Options allow for optimizing by choosing what data to fetch
   */
  export async function processRepositoriesData(
    repos: GitHubRepo[], 
    options: { 
      maxRepos?: number;
      skipContributors?: boolean;
      skipIssues?: boolean;
      skipPullRequests?: boolean;
      skipReadme?: boolean;
      userToken?: string;
    } = {}
  ): Promise<ProcessedRepo[]> {
    const processedRepos: ProcessedRepo[] = [];
    
    // Check rate limit first and throw if exceeded
    const hasQuota = await checkRateLimit();
    if (!hasQuota) {
      throw new GitHubRateLimitError();
    }
    
    // Process a limited number of repos to prevent excessive API calls
    // Allow caller to specify fewer if needed
    const maxRepos = options.maxRepos || 5;
    const reposToProcess = repos.slice(0, maxRepos);
    
    // If we have a GitHub token, try to use GraphQL for batch processing
    // This would be even more efficient but requires modifying the GraphQL query
    // to handle multiple repositories in one request
    
    // For now, process sequentially with optimizations
    for (const repo of reposToProcess) {
      try {
        // Check rate limit before each repo processing, but less frequently
        // We're now using cached checks more often
        const stillHasQuota = await checkRateLimit();
        if (!stillHasQuota) {
          // Return what we have so far rather than failing completely
          console.warn("Rate limit reached during repository processing. Returning partial results.");
          return processedRepos;
        }
        
        // Process repository with only the minimal data needed
        // Basic repo data is always included, but additional API calls can be skipped
        // if we don't need that data right now
        
        // For now, just use the existing function with the optimizations we added
        // Process repository with user token if available
        const processedRepo = await processRepositoryData(repo, options.userToken);
        processedRepos.push(processedRepo);
      } catch (error) {
        console.error(`Error processing repository ${repo.full_name}:`, error);
        // If it's a rate limit error, return what we have so far
        if (error instanceof GitHubRateLimitError || 
            (error instanceof Error && error.message.includes("rate limit exceeded"))) {
          return processedRepos;
        }
        // Otherwise continue with the next repo
      }
    }
    
    return processedRepos;
  }

  /**
   * Function to get popular and trending repositories on the main page
   * Heavily optimized to reduce API calls while still showing meaningful data
   */
  export async function getExplorePageRepositories(page = 1): Promise<{
    popular: ProcessedRepo[];
    trending: ProcessedRepo[];
  }> {
    try {
      // Single check of rate limit (using cached data when possible)
      const hasQuota = await checkRateLimit();
      if (!hasQuota) {
        throw new GitHubRateLimitError();
      }
      
      // Fetch basic repository data (these are relatively light API calls)
      const [popularRepos, trendingRepos] = await Promise.all([
        fetchQualityRepos(page),
        fetchTrendingRepos(page),
      ]);
      
      // Process with minimal data fetching - we don't need all details for the explore page
      // We only need 3 repos of each type for the explore page preview
      const options = {
        maxRepos: 3,
        skipContributors: true,  // Skip these heavy API calls for the main page
        skipIssues: true,        // Skip these for preview cards
        skipPullRequests: true,  // Skip these for preview cards
        skipReadme: true         // Skip readme for preview cards
      };
      
      // Process them to get just the essential details to render cards
      const [processedPopular, processedTrending] = await Promise.all([
        processRepositoriesData(popularRepos.slice(0, 3), options),
        processRepositoriesData(trendingRepos.slice(0, 3), options),
      ]);
      
      return {
        popular: processedPopular,
        trending: processedTrending,
      };
    } catch (error) {
      console.error("Error fetching explore page repositories:", error);
      
      // Re-throw if it's a rate limit error
      if (error instanceof GitHubRateLimitError || 
          (error instanceof Error && error.message.includes("rate limit exceeded"))) {
        throw error;
      }
      
      return {
        popular: [],
        trending: [],
      };
    }
  }