"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { formatNumber } from "@/lib/github-api";



export default function DashboardClient({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [recommendedRepos, setRecommendedRepos] = useState<any[]>([]);  const [repoReasons, setRepoReasons] = useState<Record<string, string>>({});
  const [savedRepos, setSavedRepos] = useState<Set<string>>(new Set());
  const [rateLimitError, setRateLimitError] = useState(false);
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

  // Helper function to safely get the owner's login name
  const getOwnerLogin = (owner: string | { login: string }): string => {
    return typeof owner === "string" ? owner : owner?.login || "";
  };

  useEffect(() => {
    // Load saved repositories from localStorage
    const loadSavedRepos = () => {
      try {
        const saved = localStorage.getItem("sourceseekr-saved");
        if (saved) {
          setSavedRepos(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        console.error("Error loading saved repos:", error);
      }
    };

    // Load user preferences from localStorage
    const loadPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem(
          "sourceseekr-preferences"
        );
        if (savedPreferences) {
          setUserPreferences(JSON.parse(savedPreferences));
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadSavedRepos();
    loadPreferences();
  }, []);

  // Fetch repositories when preferences change
  useEffect(() => {
    // Fetch repositories
    const fetchRecommendedRepos = async () => {
      try {
        setLoading(true);

        // Check if we have user preferences for recommendations
        if (
          userPreferences.preferredLanguages.length > 0 ||
          userPreferences.interests.length > 0
        ) {
          try {
            // Import the Deepseek API
            const { getRecommendationReason } = await import(
              "@/lib/deepseek-api"
            );

            // Build search query based on user preferences
            let query = "";

            // Add languages
            if (userPreferences.preferredLanguages.length > 0) {
              query += userPreferences.preferredLanguages[0] + " ";
            }

            // Add topics based on interests
            if (userPreferences.interests.length > 0) {
              query += userPreferences.interests[0] + " ";
            }

            query = query.trim() || "stars:>1000"; // Default fallback

            // Use the server proxy API to avoid CORS issues
            const response = await fetch(
              `/api/github/repos?type=search&query=${encodeURIComponent(
                query
              )}&limit=10`
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch repositories: ${response.status}`
              );
            }

            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
              // Generate recommendation reasons
              const reasons: Record<string, string> = {};
              data.data.forEach((repo: any) => {
                reasons[repo.id.toString()] = getRecommendationReason(
                  repo,
                  userPreferences
                );
              });

              setRecommendedRepos(data.data);
              setRepoReasons(reasons);
              return;
            }
          } catch (error) {
            console.error(
              "Error with recommendations, falling back to popular repos:",
              error
            );
          }
        }

        // Fallback to popular repositories
        const response = await fetch("/api/github/repos?type=popular&limit=10");

        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setRecommendedRepos(data.data);
        } else {
          console.error("Error in API response:", data.error);
          setRecommendedRepos([]);

          if (data.error && data.error.includes("rate limit")) {
            setRateLimitError(true);
          }
        }
      } catch (error) {
        console.error("Error fetching recommended repositories:", error);
        setRecommendedRepos([]);

        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes("rate limit")) {
          setRateLimitError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedRepos();
  }, [userPreferences]);

  const toggleSaveRepo = (repoId: string) => {
    try {
      const newSavedRepos = new Set(savedRepos);

      if (newSavedRepos.has(repoId)) {
        newSavedRepos.delete(repoId);
      } else {
        newSavedRepos.add(repoId);
      }

      setSavedRepos(newSavedRepos);
      localStorage.setItem(
        "sourceseekr-saved",
        JSON.stringify([...newSavedRepos])
      );
    } catch (error) {
      console.error("Error saving repository:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">
          Loading your personalized dashboard...
        </p>
      </div>
    );
  }

  if (rateLimitError) {
    const RateLimitError = dynamic(
      () => import("@/components/rate-limit-error"),
      {
        ssr: false,
        loading: () => (
          <p className="text-center py-12">Loading error message...</p>
        ),
      }
    );

    return <RateLimitError />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with welcome message */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {session.user?.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground">
          {userPreferences.preferredLanguages.length > 0
            ? `Here are your personalized repository recommendations based on your preferences.`
            : `Complete your profile to get personalized repository recommendations.`}
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/explore"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-primary/10 p-3 rounded-full">
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
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Explore Repositories</h3>
            <p className="text-sm text-muted-foreground">
              Discover new projects with advanced filters
            </p>
          </div>
        </Link>

        <Link
          href="/saved"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-primary/10 p-3 rounded-full">
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
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Saved Repositories</h3>
            <p className="text-sm text-muted-foreground">
              View your bookmarked projects
            </p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-primary/10 p-3 rounded-full">
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
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Update Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Personalize your recommendation settings
            </p>
          </div>
        </Link>
      </div>

      {/* Profile Completion Banner */}
      {(!userPreferences.preferredLanguages.length ||
        !userPreferences.interests.length) && (
        <div className="bg-card border-2 border-dashed border-primary/30 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
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
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Set your programming languages and interests to get
                  personalized recommendations
                </p>
              </div>
            </div>
            <Link href="/profile" className="btn btn-primary whitespace-nowrap">
              Update Profile
            </Link>
          </div>
        </div>
      )}

      {/* Recommended Repositories */}
      <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>

      {recommendedRepos.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No repositories found. Please try again later or update your
            preferences.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {recommendedRepos.map((repo) => (
            <div
              key={repo.id}
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Image
                    src={repo.owner.avatar_url}
                    alt={`${getOwnerLogin(repo.owner)} avatar`}
                    width={48}
                    height={48}
                    className="rounded-lg border border-border"
                    priority
                  />
                  <div>
                    <h2 className="text-xl font-bold flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/repository/${getOwnerLogin(repo.owner)}/${
                          repo.name
                        }`}
                        className="hover:text-primary transition-colors"
                      >
                        {repo.full_name}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground mb-2">
                      {repo.description}
                    </p>

                    {repoReasons[repo.id.toString()] && (
                      <p className="text-sm text-primary mb-3 italic">
                        Recommended: {repoReasons[repo.id.toString()]}
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
                          {formatNumber(repo.stargazers_count)}
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
                          {formatNumber(repo.forks_count)}
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
                          {formatNumber(repo.open_issues_count)}
                        </span>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(repo.topics || []).slice(0, 5).map((topic: string) => (
                        <span
                          key={topic}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {topic}
                        </span>
                      ))}
                      {repo.topics && repo.topics.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          +{repo.topics.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 min-w-[130px]">
                  <Link
                    href={`/repository/${getOwnerLogin(repo.owner)}/${
                      repo.name
                    }`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    View Details
                  </Link>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm flex-1"
                  >
                    GitHub
                  </a>
                  <button
                    onClick={() => toggleSaveRepo(repo.id.toString())}
                    className="btn btn-ghost btn-sm flex-1 flex items-center justify-center relative group"
                    aria-label={
                      savedRepos.has(repo.id.toString())
                        ? "Remove from saved"
                        : "Save repository"
                    }
                    title={
                      savedRepos.has(repo.id.toString())
                        ? "Remove from saved"
                        : "Save repository"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={
                        savedRepos.has(repo.id.toString())
                          ? "currentColor"
                          : "none"
                      }
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                      />
                    </svg>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card text-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {savedRepos.has(repo.id.toString())
                        ? "Remove from saved"
                        : "Save repository"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Chat Banner */}
      <div className="mt-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">
                AI-Powered GitHub Assistant
              </h3>
              <p className="text-muted-foreground">
                Chat with our AI assistant to find repositories, get programming
                advice, and connect with other developers.
              </p>
            </div>
          </div>
          <Link href="/chat" className="btn btn-primary whitespace-nowrap">
            Start Chatting
          </Link>
        </div>
      </div>
    </div>
  );
}