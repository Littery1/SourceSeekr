"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { formatDate, formatNumber, formatFileSize } from "@/lib/github-api";
import toast from "react-hot-toast";

interface Repository {
  id: number;
  repoId: number;
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number; // Changed from string to number
  forks: number; // Changed from string to number
  issues: number;
  ownerAvatar: string;
  topics: string[];
  size: number;
  url: string;
  homepage: string | null;
  license: string | null;
  updatedAt: Date;
  createdAt: Date;
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Form state - what the user is currently inputting
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [beginnerFriendly, setBeginnerFriendly] = useState<boolean>(false);
  
  // Active filters - what's actually being applied to the search (only updated when form is submitted)
  const [activeFilters, setActiveFilters] = useState({
    searchTerm: "",
    languageFilter: "all",
    sizeFilter: "all",
    topicFilter: "all",
    sortBy: "relevance",
    beginnerFriendly: false
  });
  const [userPreferences, setUserPreferences] = useState<{
    interests: string[];
    skillLevel: string;
    looking: string[];
    preferredLanguages: string[];
  }>({
    interests: [],
    skillLevel: "intermediate",
    looking: [],
    preferredLanguages: [],
  });

  // Store recommendation reasons
  const [repoReasons, setRepoReasons] = useState<Record<string, string>>({});

  // Track if we're showing cached results
  const [fromCache, setFromCache] = useState(false);

  // Load user preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && session) {
      const savedPreferences = localStorage.getItem("sourceseekr-preferences");
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        setUserPreferences(prefs);

        // Apply user preferences to filters
        if (prefs.preferredLanguages.length > 0) {
          setLanguageFilter(prefs.preferredLanguages[0]); // Use first preferred language
        }

        if (prefs.looking.includes("Beginner Friendly")) {
          setBeginnerFriendly(true);
        }

        // Set topics based on interests
        if (prefs.interests.length > 0) {
          const relatedTopics: Record<string, string> = {
            "Web Development": "web",
            "Mobile Apps": "mobile",
            "Data Science": "data-science",
            "Machine Learning": "machine-learning",
            "Game Development": "game",
            DevOps: "devops",
            Security: "security",
            Backend: "backend",
            Frontend: "frontend",
            "UI/UX": "ui",
            "Cloud Computing": "cloud",
            Blockchain: "blockchain",
            IoT: "iot",
            "AR/VR": "ar-vr",
          };

          const firstInterest = prefs.interests[0];
          if (relatedTopics[firstInterest]) {
            setTopicFilter(relatedTopics[firstInterest]);
          }
        }
      }
    }
  }, [session]);

  // Fetch repositories from API
  const [rateLimitError, setRateLimitError] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");

  // Function to fetch repositories with active filters
  const fetchRepositories = async (page = 1) => {
    try {
      setLoading(true);

      // Import the GitHub API functions
      const { fetchQualityRepos, processRepositoriesData } = await import(
        "@/lib/github-api"
      );

      // Build the query string with active filters
      let query = "";
      
      // Add language filter if selected
      if (activeFilters.languageFilter !== "all") {
        query += `language:${activeFilters.languageFilter.toLowerCase()} `;
      }
      
      // Add topic filter if selected
      if (activeFilters.topicFilter !== "all") {
        query += `topic:${activeFilters.topicFilter} `;
      }
      
      // Add search term if provided
      if (activeFilters.searchTerm.trim()) {
        query += activeFilters.searchTerm.trim();
      }
      
      // Ensure we have some query
      query = query.trim();

      console.log("Searching with query:", query);
      
      try {
        // Fetch repositories with query
        const fetchedRepos = await fetchQualityRepos(page, query, activeFilters.beginnerFriendly);
        const processedRepos = await processRepositoriesData(fetchedRepos, {
          maxRepos: 15,
        });

        // Format repositories to match your interface
        const formattedRepos = processedRepos.map((repo) => ({
          id: repo.id,
          repoId: repo.id,
          name: repo.name,
          owner: repo.owner,
          fullName: `${repo.owner}/${repo.name}`,
          description: repo.description,
          language: repo.language,
          stars:
            typeof repo.stars === "string" ? parseInt(repo.stars) : repo.stars,
          forks:
            typeof repo.forks === "string" ? parseInt(repo.forks) : repo.forks,
          issues:
            typeof repo.issuesCount === "string"
              ? parseInt(repo.issuesCount.replace(/[^\d]/g, "")) || 0
              : repo.issuesCount || 0,
          ownerAvatar: repo.ownerAvatar,
          topics: repo.topics || [],
          size:
            typeof repo.size === "string"
              ? parseInt(repo.size)
              : repo.size || 0,
          url: `https://github.com/${repo.owner}/${repo.name}`,
          homepage: repo.homepage,
          license: repo.license,
          updatedAt: new Date(repo.updatedAt || Date.now()),
          createdAt: new Date(repo.createdAt || Date.now()),
        }));

        if (page === 1) {
          setRepositories(formattedRepos);
        } else {
          setRepositories(prev => [...prev, ...formattedRepos]);
        }
        
        setCurrentPage(page);
        setHasMore(formattedRepos.length > 0);
      } catch (apiError) {
        console.error("GitHub API error:", apiError);
        
        // If there was an error with the specific query, try a basic fallback query
        if (query) {
          console.log("Trying fallback query...");
          const fallbackRepos = await fetchQualityRepos(1, "", false);
          const processedRepos = await processRepositoriesData(fallbackRepos, {
            maxRepos: 10,
          });

          // Process fallback repos
          const formattedRepos = processedRepos.map((repo) => ({
            id: repo.id,
            repoId: repo.id,
            name: repo.name,
            owner: repo.owner,
            fullName: `${repo.owner}/${repo.name}`,
            description: repo.description,
            language: repo.language,
            stars:
              typeof repo.stars === "string" ? parseInt(repo.stars) : repo.stars,
            forks:
              typeof repo.forks === "string" ? parseInt(repo.forks) : repo.forks,
            issues:
              typeof repo.issuesCount === "string"
                ? parseInt(repo.issuesCount.replace(/[^\d]/g, "")) || 0
                : repo.issuesCount || 0,
            ownerAvatar: repo.ownerAvatar,
            topics: repo.topics || [],
            size:
              typeof repo.size === "string"
                ? parseInt(repo.size)
                : repo.size || 0,
            url: `https://github.com/${repo.owner}/${repo.name}`,
            homepage: repo.homepage,
            license: repo.license,
            updatedAt: new Date(repo.updatedAt || Date.now()),
            createdAt: new Date(repo.createdAt || Date.now()),
          }));
          
          setRepositories(formattedRepos);
          setHasMore(true);
        } else {
          throw apiError; // If fallback query also fails, re-throw the error
        }
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      // Fallback data in case of error
      setRepositories([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle initial load
  useEffect(() => {
    fetchRepositories(1);
  }, []);

  // Function to load more repositories
  const loadMoreRepositories = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      await fetchRepositories(nextPage);
    } catch (error) {
      console.error("Error loading more repositories:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter and sort repositories based on search term and other filters
  const filteredAndSortedRepos = repositories
    .filter((repo) => {
      // Apply search filter
      if (!searchTerm) return true;

      const searchMatch =
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description &&
          repo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        repo.topics.some((topic) =>
          topic.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return searchMatch;
    })
    .filter((repo) => {
      // Apply size filter if selected
      if (sizeFilter === "all") return true;

      switch (sizeFilter) {
        case "small":
          return repo.size < 50000; // Less than 50MB
        case "medium":
          return repo.size >= 50000 && repo.size <= 200000; // Between 50MB and 200MB
        case "large":
          return repo.size > 200000; // More than 200MB
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return b.stars - a.stars;
        case "recent":
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        default: // "relevance" - already sorted by DeepSeek API
          return 0;
      }
    });

  // Programming language options for the filter dropdown
  const languageOptions = {
    JavaScript: "#f1e05a",
    TypeScript: "#2b7489",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Ruby: "#701516",
    PHP: "#4F5D95",
    CSS: "#563d7c", 
    HTML: "#e34c26",
    Swift: "#ffac45",
    Kotlin: "#F18E33",
    Rust: "#dea584",
    C: "#555555",
    "C++": "#f34b7d",
    "C#": "#178600"
  };

  // Get unique topics for filter dropdown (top 10 most common)
  const allTopics = repositories.flatMap((repo) => repo.topics);
  const topicCounts = allTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);

  // Function to save a repository
  const handleSaveRepository = async (repositoryId: number) => {
    if (!session) {
      // Prompt to login if not authenticated
      toast.error("Please sign in to save repositories");
      return;
    }

    try {
      // Find the repository in our list
      const repo = repositories.find((r) => r.id === repositoryId);

      if (!repo) {
        throw new Error("Repository not found");
      }

      const res = await fetch("/api/repositories/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
          repoId: repo.id,
          name: repo.name,
          owner: repo.owner,
          fullName: repo.fullName,
          description: repo.description,
          language: repo.language,
          stars: repo.stars,
          forks: repo.forks,
          issues: repo.issues,
          ownerAvatar: repo.ownerAvatar,
          topics: repo.topics,
          size: repo.size,
          url: repo.url,
          homepage: repo.homepage,
          license: repo.license,
          updatedAt: repo.updatedAt,
          createdAt: repo.createdAt
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save repository: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Repository saved successfully!");
      } else {
        throw new Error(data.error || "Failed to save repository");
      }
    } catch (error) {
      console.error("Error saving repository:", error);
      toast.error("Failed to save repository. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading repositories...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Background elements */}
      <div className="blurred-circle w-[500px] h-[500px] top-[-100px] right-[-150px] opacity-30 z-0"></div>
      <div className="blurred-circle w-[600px] h-[600px] bottom-[10%] left-[-200px] opacity-20 z-0"></div>

      {/* Rate limit warning */}
      {rateLimitError && (
        <div className="bg-destructive/10 border border-destructive rounded-xl p-4 mb-6 relative z-10">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-destructive mb-1">
                GitHub API Rate Limit Exceeded
              </h3>
              <p className="text-muted-foreground text-sm">
                {rateLimitMessage ||
                  "Showing cached results. Fresh data will be available when rate limits reset."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-bold mb-2">Explore Repositories</h1>
        <p className="text-muted-foreground mb-8">
          Discover GitHub repositories powered by Deepseek AI recommendations.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8 relative z-10">
        <form onSubmit={(e) => {
              e.preventDefault();
              // Set active filters from current form values when submitted
              setActiveFilters({
                searchTerm,
                languageFilter,
                sizeFilter,
                topicFilter,
                sortBy,
                beginnerFriendly
              });
              // Fetch repositories with new filters
              fetchRepositories(1);
            }} className="flex flex-col gap-6">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-muted-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search repositories, topics, or description..."
              className="input pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "2.75rem" }}
            />
          </div>

          {/* Filter options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Programming Language
              </label>
              <select
                className="input w-full"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
              >
                <option value="all">All Languages</option>
                {Object.keys(languageOptions).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Project Size
              </label>
              <select
                className="input w-full"
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
              >
                <option value="all">Any Size</option>
                <option value="small">Small (&lt; 50MB)</option>
                <option value="medium">Medium (50MB - 200MB)</option>
                <option value="large">Large (&gt; 200MB)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Topic</label>
              <select
                className="input w-full"
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
              >
                <option value="all">All Topics</option>
                {topTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                className="input w-full"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="stars">Most Stars</option>
                <option value="recent">Recently Updated</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {/* Toggle for beginner-friendly */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
            <input
              type="checkbox"
              id="beginnerFriendly"
              checked={beginnerFriendly}
              onChange={(e) => setBeginnerFriendly(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="beginnerFriendly" className="text-sm font-medium">
              Show only beginner-friendly repositories (good documentation and
              labeled issues)
            </label>
            </div>
            <button type="submit" className="btn btn-primary">Apply Filters</button>
          </div>
        </form>
      </div>

      {/* AI Recommendation Banner - Different versions for auth and non-auth users */}
      {!session ? (
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-6 mb-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">
                Get Personalized Recommendations
              </h2>
              <p className="text-muted-foreground">
                Sign in with GitHub to receive AI-powered repository
                recommendations based on your interests and skill level.
              </p>
            </div>
            <Link
              href="/login"
              className="btn btn-primary whitespace-nowrap flex items-center gap-2"
            >
              <Image
                src="/images/github.svg"
                alt="GitHub"
                width={20}
                height={20}
              />
              Sign in with GitHub
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-6 mb-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">
                {userPreferences.preferredLanguages.length > 0
                  ? `Recommendations for ${userPreferences.preferredLanguages
                      .slice(0, 3)
                      .join(", ")} Developers`
                  : "Personalized Recommendations"}
              </h2>
              <p className="text-muted-foreground">
                {userPreferences.interests.length > 0
                  ? `Based on your interests in ${userPreferences.interests
                      .slice(0, 2)
                      .join(", ")}${
                      userPreferences.interests.length > 2 ? " and more" : ""
                    }`
                  : "Update your profile to get even more personalized repository recommendations"}
              </p>
            </div>
            <Link href="/profile" className="btn btn-outline whitespace-nowrap">
              Update Preferences
            </Link>
          </div>
        </div>
      )}

      {/* Repository Results */}
      {filteredAndSortedRepos.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center relative z-10">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No repositories found</h2>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search filters or try a different search term
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setLanguageFilter("all");
              setSizeFilter("all");
              setTopicFilter("all");
              setBeginnerFriendly(false);
            }}
            className="btn btn-primary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4 relative z-10">
            Found {filteredAndSortedRepos.length} repositories
            {fromCache && " (from cache)"}
          </p>

          <div className="grid grid-cols-1 gap-6 relative z-10">
            {filteredAndSortedRepos.map((repo) => (
              <div key={repo.id.toString()}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Image
                      src={repo.ownerAvatar || "/images/default.png"}
                      alt={`${repo.owner} avatar`}
                      width={48}
                      height={48}
                      className="rounded-lg border border-border"
                    />
                    <div>
                      <h2 className="text-xl font-bold flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          href={`/repository/${repo.owner}/${repo.name}`}
                          className="hover:text-primary transition-colors"
                        >
                          {repo.owner}/{repo.name}
                        </Link>
                        {repo.topics.some(
                          (topic) =>
                            topic.includes("good-first-issue") ||
                            topic.includes("beginner") ||
                            topic.includes("first-timers")
                        ) && (
                          <span className="text-xs font-normal text-white bg-green-600 px-2 py-0.5 rounded-full">
                            Beginner friendly
                          </span>
                        )}
                      </h2>
                      <p className="text-muted-foreground mb-2">
                        {repo.description}
                      </p>
                      {session && repoReasons[repo.id] && (
                        <p className="text-sm text-primary mb-3 italic">
                          Recommended: {repoReasons[repo.id]}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mb-3">
                        {repo.language && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-primary"></span>
                            <span className="text-sm">{repo.language}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-amber-400"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm">
                            {formatNumber(parseInt(repo.stars.toString(), 10))}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-muted-foreground"
                          >
                            <path
                              fillRule="evenodd"
                              d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm">
                            {formatNumber(parseInt(repo.forks.toString(), 10))}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-muted-foreground"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm">
                            {formatNumber(repo.issues)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-muted-foreground"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                            />
                          </svg>
                          <span className="text-sm">
                            Updated {formatDate(repo.updatedAt.toISOString())}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-muted-foreground"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                            />
                          </svg>
                          <span className="text-sm">
                            {formatFileSize(repo.size)}
                          </span>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {repo.topics.slice(0, 5).map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 5 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            +{repo.topics.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 min-w-[130px]">
                    <Link
                      href={`/repository/${repo.owner}/${repo.name}`}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      View Details
                    </Link>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm flex-1"
                    >
                      GitHub
                    </a>
                    <button
                      onClick={() => handleSaveRepository(repo.id)}
                      className="btn btn-ghost btn-sm flex-1 flex items-center justify-center"
                      disabled={!session}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                        />
                      </svg>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && !loadingMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreRepositories}
                  className="btn btn-outline"
                >
                  Show More Repositories
                </button>
              </div>
            )}

            {loadingMore && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more repositories...</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}