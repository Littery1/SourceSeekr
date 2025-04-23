"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  processRepositoryData,
  ProcessedRepo,
  fetchSimilarRepositories,
  formatDate,
} from "@/lib/github-api";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";

interface SimilarRepositoriesProps {
  language: string | null;
  topics: string[];
  excludeRepo: string;
}

// Helper function to format the README with basic markdown support
const formatReadme = (readmeText: string | null) => {
  if (!readmeText) return '';

  // Basic formatting for headers
  let formatted = readmeText
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold my-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold my-2">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-base font-medium my-2">$1</h4>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg my-3 overflow-x-auto"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    // Lists
    .replace(/^\s*[\-\*]\s+(.*$)/gm, '<li class="ml-5 mb-1">$1</li>')
    .replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="ml-5 mb-1 list-decimal">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Horizontal rule
    .replace(/^[\-\*\_]{3,}$/gm, '<hr class="my-4 border-t border-border" />');
    
  // Convert newlines to paragraphs for regular text
  let paragraphs = formatted.split('\n');
  formatted = paragraphs.map(p => {
    // Skip if it's already a formatted element
    if (p.trim().startsWith('<')) return p;
    if (p.trim() === '') return '<br />';
    return `<p class="mb-2">${p}</p>`;
  }).join('');
  
  return formatted;
}; 

// Component to fetch and display similar repositories
const SimilarRepositories = ({
  language,
  topics,
  excludeRepo,
}: SimilarRepositoriesProps) => {
  const [similarRepos, setSimilarRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In SimilarRepositories component
  useEffect(() => {
  const fetchSimilarRepos = async () => {
    try {
      setLoading(true);
      // Use a simpler query with just one topic to avoid 422 errors
     const simplifiedTopics = topics.length > 0 ? [topics[0]] : [];

      const fetchedRepos = await fetchSimilarRepositories(
        language,
        simplifiedTopics,
        excludeRepo,
        3
      ); 
      setSimilarRepos(fetchedRepos);
    } catch (error) {
      console.error("Error fetching similar repositories:", error);
      setSimilarRepos([]);
      // Handle any API errors gracefully
      if (error instanceof Error) {
        console.warn("GitHub API error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

    fetchSimilarRepos();
  }, [language, topics, excludeRepo]);

  if (loading) {
    return (
      <div className="col-span-3 flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (similarRepos.length === 0) {
    return (
      <div className="col-span-3 text-center py-8">
        <p className="text-muted-foreground">No similar repositories found.</p>
      </div>
    );
  }

  return (
    <>
      {similarRepos.map((repo) => (
        <div
          key={repo.id}
          className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <Image
                src={repo.owner.avatar_url}
                width={36}
                height={36}
                alt={`${repo.owner.login} avatar`}
                className="rounded-full border border-border"
              />
              <div>
                <h3 className="font-semibold hover:text-primary transition-colors duration-200">
                  {repo.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  by {repo.owner.login}
                </p>
              </div>
            </div>
            <button
              aria-label="Save repository"
              className="text-muted-foreground hover:text-primary transition-colors"
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
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
            {repo.description || "No description provided"}
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {repo.language && (
              <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span>{repo.language}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3 text-amber-400"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{repo.stargazers_count.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3 text-muted-foreground"
              >
                <path
                  fillRule="evenodd"
                  d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{repo.forks_count.toLocaleString()}</span>
            </div>
          </div>

          <Link
            href={`/repository/${repo.owner.login}/${repo.name}`}
            className="btn btn-outline w-full btn-sm"
          >
            View Details
          </Link>
        </div>
      ))}
    </>
  );
};

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: "7 Days", value: "7d", days: 7 },
  { label: "30 Days", value: "30d", days: 30 },
  { label: "3 Months", value: "3m", days: 90 },
  { label: "1 Year", value: "1y", days: 365 },
  { label: "All Time", value: "all", days: 0 },
];

// Mock data for graphs
const generateMockGraphData = (
  days: number,
  trend: "growing" | "stable" | "declining" = "growing"
) => {
  const data = [];
  let today = new Date();
  let baseValue = 100 + Math.random() * 200;

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Generate different trends
    let changePercentage;
    if (trend === "growing") {
      changePercentage = Math.random() * 0.1 - 0.02; // Mostly growing with occasional dips
    } else if (trend === "declining") {
      changePercentage = Math.random() * 0.1 - 0.08; // Mostly declining with occasional jumps
    } else {
      changePercentage = Math.random() * 0.08 - 0.04; // Roughly stable
    }

    baseValue = Math.max(0, baseValue * (1 + changePercentage));

    data.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(baseValue),
    });
  }

  return data;
};

export default function RepositoryPage({
  params,
}: {
  params: { owner: string; name: string };
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { owner, name } = params;
  
  // Add session to get the user's GitHub token
  const { data: session } = useSession();

  // Add error boundary for auth errors
  const [authError, setAuthError] = useState<string | null>(null);

  const [repository, setRepository] = useState<ProcessedRepo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(
    timeRanges[1]
  ); // Default to 30 days
  const [activeTab, setActiveTab] = useState<
    "overview" | "contributors" | "issues" | "pulls" | "stars"
  >("overview");
  const [isSaved, setIsSaved] = useState(false);

  // Graph data based on selected time range
  const [starsData, setStarsData] = useState<any[]>([]);
  const [issuesData, setIssuesData] = useState<any[]>([]);
  const [pullsData, setPullsData] = useState<any[]>([]);
  const [contributionsData, setContributionsData] = useState<any[]>([]);
  // Move these functions ABOVE the useEffect that uses them
  const getActiveData = useCallback(() => {
    switch (activeTab) {
      case "stars":
        return starsData;
      case "issues":
        return issuesData;
      case "pulls":
        return pullsData;
      case "contributors":
        return contributionsData;
      default:
        return starsData;
    }
  }, [activeTab, starsData, issuesData, pullsData, contributionsData]);

  const getGraphConfig = useCallback(() => {
    const configs = {
      stars: {
        title: "Stars Over Time",
        lineColor: "rgb(234, 179, 8)",
        pointColor: "rgb(234, 179, 8)",
        gradientStart: "rgba(234, 179, 8, 0.2)",
        gradientEnd: "rgba(234, 179, 8, 0)",
      },
      issues: {
        title: "Issues Over Time",
        lineColor: "rgb(239, 68, 68)",
        pointColor: "rgb(239, 68, 68)",
        gradientStart: "rgba(239, 68, 68, 0.2)",
        gradientEnd: "rgba(239, 68, 68, 0)",
      },
      pulls: {
        title: "Pull Requests Over Time",
        lineColor: "rgb(16, 185, 129)",
        pointColor: "rgb(16, 185, 129)",
        gradientStart: "rgba(16, 185, 129, 0.2)",
        gradientEnd: "rgba(16, 185, 129, 0)",
      },
      contributors: {
        title: "Contributions Over Time",
        lineColor: "rgb(59, 130, 246)",
        pointColor: "rgb(59, 130, 246)",
        gradientStart: "rgba(59, 130, 246, 0.2)",
        gradientEnd: "rgba(59, 130, 246, 0)",
      },
      overview: {
        title: "Repository Activity Overview",
        lineColor: "#3b82f6",
        pointColor: "#3b82f6",
        gradientStart: "rgba(59, 130, 246, 0.2)",
        gradientEnd: "rgba(59, 130, 246, 0)",
      },
    };

    return configs[activeTab] || configs.overview;
  }, [activeTab]);
  // Effect 1: Update graph data when time range changes
  useEffect(() => {
    // Only update data when time range changes
    setStarsData(generateMockGraphData(selectedTimeRange.days, "growing"));
    setIssuesData(generateMockGraphData(selectedTimeRange.days, "stable"));
    setPullsData(generateMockGraphData(selectedTimeRange.days, "stable"));
    setContributionsData(
      generateMockGraphData(selectedTimeRange.days, "growing")
    );
  }, [selectedTimeRange]); // Only depend on selectedTimeRange
  // Effect 2: Draw graph when data or active tab changes
  useEffect(() => {
    if (canvasRef.current && !loading && starsData.length > 0) {
      drawLineGraph(canvasRef.current, getActiveData(), getGraphConfig());
    }
  }, [
    canvasRef,
    loading,
    activeTab,
    starsData,
    issuesData,
    pullsData,
    contributionsData,
    getActiveData,
    getGraphConfig,
  ]);
  // Draw line graph
  const drawLineGraph = (
    canvas: HTMLCanvasElement | null,
    data: any[],
    config: any
  ) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get min/max values
    const values = data.map((d) => d.value);
    const minValue = Math.min(...values) * 0.9;
    const maxValue = Math.max(...values) * 1.1;

    // Padding
    const padding = {
      top: 30,
      right: 30,
      bottom: 50,
      left: 60,
    };

    // Graph dimensions
    const graphWidth = canvas.width - padding.left - padding.right;
    const graphHeight = canvas.height - padding.top - padding.bottom;

    // X and Y scales
    const xScale = graphWidth / (data.length - 1);
    const yScale = graphHeight / (maxValue - minValue);

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--border")
      .trim();

    // Y axis
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, canvas.height - padding.bottom);

    // X axis
    ctx.moveTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();

    // Draw grid lines - horizontal
    const tickCount = 5;
    ctx.beginPath();
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--border")
      .trim();
    ctx.setLineDash([5, 5]);

    for (let i = 0; i <= tickCount; i++) {
      const y = padding.top + (graphHeight / tickCount) * i;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);

      // Draw tick values
      const tickValue = Math.round(
        maxValue - ((maxValue - minValue) / tickCount) * i
      );
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--muted-foreground")
        .trim();
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(tickValue.toString(), padding.left - 10, y + 4);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw x-axis labels (dates)
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted-foreground")
      .trim();
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";

    // If we have a lot of points, show fewer x labels
    const labelInterval = data.length > 30 ? Math.ceil(data.length / 10) : 1;

    data.forEach((point, i) => {
      if (i % labelInterval === 0 || i === data.length - 1) {
        const x = padding.left + i * xScale;
        const date = new Date(point.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(formattedDate, x, canvas.height - padding.bottom + 20);
      }
    });

    // Draw data line
    ctx.beginPath();
    ctx.strokeStyle = config.lineColor;
    ctx.lineWidth = 3;

    data.forEach((point, i) => {
      const x = padding.left + i * xScale;
      const y =
        canvas.height - padding.bottom - (point.value - minValue) * yScale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient area under the line
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(
      0,
      padding.top,
      0,
      canvas.height - padding.bottom
    );
    gradient.addColorStop(0, config.gradientStart || "rgba(59, 130, 246, 0.2)");
    gradient.addColorStop(1, config.gradientEnd || "rgba(59, 130, 246, 0)");

    // Starting point at the bottom left
    ctx.moveTo(padding.left, canvas.height - padding.bottom);

    // Draw the bottom of the area
    data.forEach((point, i) => {
      const x = padding.left + i * xScale;
      const y =
        canvas.height - padding.bottom - (point.value - minValue) * yScale;
      ctx.lineTo(x, y);
    });

    // Draw line to bottom right and back to starting point
    ctx.lineTo(
      padding.left + (data.length - 1) * xScale,
      canvas.height - padding.bottom
    );
    ctx.lineTo(padding.left, canvas.height - padding.bottom);

    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw data points
    ctx.fillStyle = config.pointColor;

    data.forEach((point, i) => {
      const x = padding.left + i * xScale;
      const y =
        canvas.height - padding.bottom - (point.value - minValue) * yScale;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw graph title
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim();
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(config.title, canvas.width / 2, padding.top / 2);
  };

useEffect(() => {
  const fetchRepositoryData = async () => {
    try {
      setLoading(true);
      
      // Use the server-side API endpoint to avoid CORS issues
      const response = await fetch(`/api/github/repos?type=repository&owner=${owner}&name=${name}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch repository: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || "Repository not found");
      }
      
      const repoData = data.data;
      
      if (!repoData) {
        throw new Error("Repository not found");
      }

      setRepository(repoData);

      // Update the date-based data displayed in the UI
      // This helps to generate meaningful graph data based on actual repo creation date
      if (repoData.createdAt) {
        const repoCreationDate = new Date(repoData.createdAt);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - repoCreationDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // If the repository is older than the current selected time range,
        // adjust the time range to something meaningful for this repo
        if (diffDays < selectedTimeRange.days) {
          // Find the closest time range that's appropriate for this repo's age
          const appropriateTimeRange =
            timeRanges.find((range) => range.days <= diffDays) || timeRanges[0];
          setSelectedTimeRange(appropriateTimeRange);
        }
      }
    } catch (err) {
      console.error("Error fetching repository:", err);

      // Check for authentication errors
      if (
        err instanceof Error &&
        (err.message.includes("NetworkError") ||
          err.message.includes("AuthError") ||
          err.message.includes("fetch"))
      ) {
        setAuthError("Authentication error. Please try refreshing the page.");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to fetch repository"
        );
      }
    } finally {
      setLoading(false);
    }
  };
  fetchRepositoryData();
}, [owner, name, selectedTimeRange, session]);

  const toggleSaved = async () => {
    // Check if the user is authenticated
    if (!session?.user) {
      toast.error("Please sign in to save repositories");
      router.push("/login");
      return;
    }
    
    try {
      setIsSaved(!isSaved);
      
      if (!repository) return;
      
      if (!isSaved) {
        // Save the repository
        const response = await fetch('/api/repositories/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repoId: repository.id,
            name: repository.name,
            owner: repository.owner,
            fullName: repository.fullName,
            description: repository.description,
            language: repository.language,
            stars: parseInt(repository.stars.replace('k', '000').replace('M', '000000')),
            forks: parseInt(repository.forks.replace('k', '000').replace('M', '000000')),
            issues: parseInt(repository.issuesCount.replace('k', '000').replace('M', '000000')),
            ownerAvatar: repository.ownerAvatar,
            topics: repository.topics,
            size: repository.size,
            url: `https://github.com/${repository.owner}/${repository.name}`,
            homepage: repository.homepage,
            license: repository.license,
            updatedAt: repository.updatedAt,
            createdAt: repository.createdAt
          }),
        });
        
        if (response.ok) {
          toast.success("Repository saved successfully");
        } else {
          // If API call fails, revert the UI state
          setIsSaved(false);
          const data = await response.json();
          toast.error(data.error || "Failed to save repository");
        }
      } else {
        // Remove from saved
        const response = await fetch(`/api/repositories/saved?fullName=${repository.fullName}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          toast.success("Repository removed from saved items");
        } else {
          // If API call fails, revert the UI state
          setIsSaved(true);
          const data = await response.json();
          toast.error(data.error || "Failed to remove repository");
        }
      }
    } catch (error) {
      console.error("Error toggling saved status:", error);
      // Revert UI state if there's an error
      setIsSaved(!isSaved);
      toast.error("Failed to update saved status");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading repository data...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Authentication Error
          </h2>
          <p className="text-muted-foreground mb-6">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mr-4"
          >
            Refresh Page
          </button>
          <button onClick={() => router.back()} className="btn btn-outline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's a rate limit error
    if (error.includes("rate limit exceeded")) {
      const RateLimitError = dynamic(
        () => import("@/components/rate-limit-error"),
        {
          ssr: false,
          loading: () => (
            <p className="text-center py-12">Loading error message...</p>
          ),
        }
      );

      return (
        <RateLimitError
          message="GitHub API rate limit exceeded. Please try again later or view other repositories."
          showButtons={true}
        />
      );
    }
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Error Loading Repository
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={() => router.back()} className="btn btn-outline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!repository) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Repository Header */}
      <div className="bg-card rounded-xl p-6 mb-8 border border-border shadow-md animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image
              src={repository.ownerAvatar}
              alt={`${owner} avatar`}
              width={64}
              height={64}
              className="rounded-lg border-2 border-primary/20"
              priority
            />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Link
                  href={`/profile/${owner}`}
                  className="hover:text-primary transition-colors"
                >
                  {owner}
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-primary">{name}</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                {repository.description || "No description provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSaved}
              className={`btn ${
                isSaved ? "btn-primary" : "btn-outline"
              } flex items-center gap-2`}
            >
              {isSaved ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Saved
                </>
              ) : (
                <>
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
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                    />
                  </svg>
                  Save
                </>
              )}
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={`https://github.com/${owner}/${name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                View on GitHub
              </a>
              
              <a
                href={`https://github.com/${owner}/${name}/issues`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Issues
              </a>
              
              <a
                href={`https://github.com/${owner}/${name}/pulls`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Pull Requests
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Repository Stats */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-slide-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm flex flex-col items-center hover:shadow-md transition-shadow">
          <div className="text-4xl font-bold mb-2 text-amber-500">
            {repository.stars}
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-amber-400"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
            <span>Stars</span>
          </div>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm flex flex-col items-center hover:shadow-md transition-shadow">
          <div className="text-4xl font-bold mb-2 text-indigo-500">
            {repository.forks}
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-indigo-400"
            >
              <path
                fillRule="evenodd"
                d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
                clipRule="evenodd"
              />
            </svg>
            <span>Forks</span>
          </div>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm flex flex-col items-center hover:shadow-md transition-shadow">
          <div className="text-4xl font-bold mb-2 text-green-500">
            {repository.pullRequests}
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-green-400"
            >
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <path d="M13 6h3a2 2 0 0 1 2 2v7" />
              <line x1="6" y1="9" x2="6" y2="21" />
            </svg>
            <span>Pull Requests</span>
          </div>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm flex flex-col items-center hover:shadow-md transition-shadow">
          <div className="text-4xl font-bold mb-2 text-red-500">
            {repository.issuesCount}
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-red-400"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>Issues</span>
          </div>
        </div>
      </div>

      {/* Repository Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Repository Details */}
        <div
          className="lg:col-span-2 flex flex-col gap-6 animate-slide-in-up"
          style={{ animationDelay: "200ms" }}
        >
          {/* Time Range Selector */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
                Analytics
              </h2>
              <div className="flex flex-wrap border border-border rounded-lg overflow-hidden">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      selectedTimeRange.value === range.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-border mb-6">
              <div className="flex space-x-6 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-2 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "overview"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("stars")}
                  className={`py-2 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "stars"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Stars
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  className={`py-2 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "issues"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Issues
                </button>
                <button
                  onClick={() => setActiveTab("pulls")}
                  className={`py-2 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "pulls"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pull Requests
                </button>
                <button
                  onClick={() => setActiveTab("contributors")}
                  className={`py-2 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "contributors"
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Contributors
                </button>
              </div>
            </div>

            {/* Graph Canvas */}
            <div className="h-64 rounded-lg bg-card border border-border p-2">
              <canvas ref={canvasRef} className="w-full h-full"></canvas>
            </div>

            {/* Current statistics summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {starsData.length > 0
                    ? starsData[starsData.length - 1].value
                    : "0"}
                </div>
                <div className="text-xs text-muted-foreground">Total Stars</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {issuesData.length > 0
                    ? issuesData[issuesData.length - 1].value
                    : "0"}
                </div>
                <div className="text-xs text-muted-foreground">Open Issues</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {pullsData.length > 0
                    ? pullsData[pullsData.length - 1].value
                    : "0"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Pull Requests
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {contributionsData.length > 0
                    ? contributionsData[contributionsData.length - 1].value
                    : "0"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Contributions
                </div>
              </div>
            </div>
          </div>

          {/* Readme */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              README.md
            </h2>
            <div className="border-t border-border pt-4 prose dark:prose-invert prose-sm max-w-none">
              {repository.readme ? (
                <div className="markdown-content">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatReadme(repository.readme),
                    }}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No README available for this repository.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details and Stats */}
        <div
          className="flex flex-col gap-6 animate-slide-in-up"
          style={{ animationDelay: "300ms" }}
        >
          {/* Repository Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
              About
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                  />
                </svg>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Primary Language
                  </h3>
                  <p>{repository.language || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Contributors
                  </h3>
                  <p>
                    {repository.contributors?.length || 0} active contributors
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Last Updated
                  </h3>
                  <p>
                    {repository.updatedAt
                      ? formatDate(repository.updatedAt)
                      : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6h.008v.008H6V6Z"
                  />
                </svg>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {repository.topics && repository.topics.length > 0 ? (
                      repository.topics.slice(0, 5).map((topic, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No topics specified
                      </span>
                    )}
                    {repository.topics && repository.topics.length > 5 && (
                      <span className="text-muted-foreground text-xs px-2 py-1">
                        +{repository.topics.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
              Top Contributors
            </h2>
            <div className="space-y-3">
              {repository.contributors
                .sort((a, b) => b.contributions - a.contributions)
                .slice(0, 6)
                .map((contributor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={contributor.avatar_url}
                          alt={`Contributor ${index + 1}`}
                          className="object-cover"
                          fill
                          sizes="32px"
                        />
                      </div>
                      <div>
                        <div className="font-medium">
                          <a
                            href={`https://github.com/${contributor.login}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline"
                          >
                            {contributor.login}
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contributor.contributions} contributions
                        </div>
                      </div>
                    </div>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${
                            (contributor.contributions /
                              repository.contributors[0].contributions) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Issues */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
              Recent Issues
            </h2>
            {repository.issues.length > 0 ? (
              <div className="space-y-3">
                {repository.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h4 className="font-medium">
                          <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline"
                          >
                            {issue.title}
                          </a>
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>Opened 3 days ago</span>
                          <span className="flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25a1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                            5 comments
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No open issues at this time
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div
            className="bg-gradient-to-br from-primary/10 to-background p-6 rounded-xl border border-primary/20 animate-slide-in-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.5 20.25l-.259-1.035a3.375 3.375 0 00-2.456-2.456L12.75 16.5l1.035-.259a3.375 3.375 0 002.456-2.456L16.5 12.75l.259 1.035a3.375 3.375 0 002.456 2.456l1.035.259-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold mb-2">AI Insights</h2>
                <p className="text-sm mb-4">
                  Here&apos;s what our AI discovered about this repository:
                </p>
                <ul className="space-y-2 text-sm mb-4">
                  {repository.contributors &&
                    repository.contributors.length > 0 && (
                      <li className="flex items-start gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          <strong>Active Community:</strong> This repository has{" "}
                          {repository.contributors.length}
                          active contributors with {repository.forks} forks,
                          showing strong community engagement.
                        </span>
                      </li>
                    )}

                  {repository.readme && (
                    <li className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Well Documented:</strong> This repository has a
                        comprehensive README with{" "}
                        {repository.readme.length > 2000
                          ? "extensive"
                          : "helpful"}{" "}
                        documentation
                        {repository.topics.includes("documentation")
                          ? " and focuses on good documentation practices."
                          : "."}
                      </span>
                    </li>
                  )}

                  {parseInt(
                    repository.stars.replace("k", "000").replace("M", "000000")
                  ) > 100 && (
                    <li className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Popular Project:</strong> With{" "}
                        {repository.stars} stars, this is a well-established
                        project in the{" "}
                        {repository.language || "software development"}{" "}
                        ecosystem.
                      </span>
                    </li>
                  )}

                  {repository.topics && repository.topics.length > 0 && (
                    <li className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Well-Tagged:</strong> This repository uses{" "}
                        {repository.topics.length} tags to categorize its
                        functionality and purpose, making it easy to discover
                        and understand.
                      </span>
                    </li>
                  )}
                </ul>
                <Link href="/chat" className="btn btn-primary text-sm">
                  Chat with AI about this repository
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Repositories Section */}
      <div
        className="mb-8 animate-slide-in-up"
        style={{ animationDelay: "500ms" }}
      >
        <h2 className="text-2xl font-bold mb-6">Similar Repositories</h2>
        {repository && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {repository.topics && repository.topics.length > 0 ? (
              <>
                {/* Fetch similar repos based on topics and language */}
                <SimilarRepositories
                  language={repository.language}
                  topics={repository.topics}
                  excludeRepo={repository.fullName}
                />
              </>
            ) : (
              <p className="text-muted-foreground">
                No similar repositories found based on topics.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
