"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { formatDate, formatNumber, formatFileSize } from "@/lib/github-api";
import toast from "react-hot-toast";

interface SavedRepository {
  id: string;
  repoId: number;
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  issues: number;
  ownerAvatar: string;
  topics: string[];
  size: number;
  url: string;
  homepage: string | null;
  license: string | null;
  updatedAt: Date;
  createdAt: Date;
  savedAt: Date;
  notes: string | null;
}

export default function SavedPage() {
  const { data: session, status } = useSession();
  const [repositories, setRepositories] = useState<SavedRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("saved-date");
  
  // Fetch saved repositories
  useEffect(() => {
    const fetchSavedRepositories = async () => {
      if (status !== "authenticated") {
        if (status === "unauthenticated") {
          setLoading(false);
        }
        return;
      }
      
      try {
        setLoading(true);
        const res = await fetch("/api/repositories/saved", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch saved repositories: ${res.status}`);
        }

               const data = await res.json();

               // The API returns the array directly.
               const savedRepoData = Array.isArray(data) ? data : [];

               // The repository data is nested inside each item
               setRepositories(
                 savedRepoData.map((item: any) => ({
                   ...item.repository,
                   savedAt: new Date(item.createdAt), // The save date is on the parent object
                   notes: item.notes,
                 }))
               );
      } catch (error) {
        console.error("Error fetching saved repositories:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedRepositories();
  }, [status]);
  
  // Function to remove a saved repository
  const handleRemoveRepository = async (fullName: string) => {
    try {
      const res = await fetch(`/api/repositories/saved?fullName=${encodeURIComponent(fullName)}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error(`Failed to remove repository: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Repository removed successfully');
        // Remove the repository from the state
        setRepositories(prevRepos => prevRepos.filter(repo => repo.fullName !== fullName));
      } else {
        throw new Error(data.error || 'Failed to remove repository');
      }
    } catch (error) {
      console.error('Error removing repository:', error);
      toast.error('Failed to remove repository. Please try again.');
    }
  };

  // Filter and sort repositories
  const filteredAndSortedRepos = repositories
    .filter(repo => {
      if (!searchTerm) return true;
      
      return (
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (repo.language && repo.language.toLowerCase().includes(searchTerm.toLowerCase())) ||
        repo.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "saved-date":
          return b.savedAt.getTime() - a.savedAt.getTime();
        case "stars":
          return b.stars - a.stars;
        case "recent":
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.savedAt.getTime() - a.savedAt.getTime();
      }
    });
  
  // Show login prompt if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Sign in to view your saved repositories</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to save and view your favorite repositories
          </p>
          <Link href="/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  // Show loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading saved repositories...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Background elements */}
      <div className="blurred-circle w-[500px] h-[500px] top-[-100px] right-[-150px] opacity-30 z-0"></div>
      <div className="blurred-circle w-[600px] h-[600px] bottom-[10%] left-[-200px] opacity-20 z-0"></div>

      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-bold mb-2">Saved Repositories</h1>
        <p className="text-muted-foreground mb-8">
          Browse and manage your saved GitHub repositories.
        </p>
      </div>

      {/* Search and Sort */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8 relative z-10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
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
              placeholder="Search saved repositories..."
              className="input pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "2.75rem" }}
            />
          </div>

          <div className="min-w-[200px]">
            <select
              className="input w-full"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="saved-date">Recently Saved</option>
              <option value="stars">Most Stars</option>
              <option value="recent">Recently Updated</option>
              <option value="name">Repository Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Repository Results */}
      {repositories.length === 0 ? (
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
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            No saved repositories yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Explore and save repositories to access them quickly later
          </p>
          <Link href="/explore" className="btn btn-primary">
            Explore Repositories
          </Link>
        </div>
      ) : filteredAndSortedRepos.length === 0 ? (
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
          <h2 className="text-xl font-semibold mb-2">
            No matching repositories
          </h2>
          <p className="text-muted-foreground mb-6">
            No saved repositories match your search criteria
          </p>
          <button onClick={() => setSearchTerm("")} className="btn btn-primary">
            Clear Search
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4 relative z-10">
            Found {filteredAndSortedRepos.length} saved repositories
          </p>

          <div className="grid grid-cols-1 gap-6 relative z-10">
            {filteredAndSortedRepos.map((repo) => (
              <div
                key={repo.id}
                className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 p-6"
              >
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
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold">
                          <Link
                            href={`/repository/${repo.owner}/${repo.name}`}
                            className="hover:text-primary transition-colors"
                          >
                            {repo.owner}/{repo.name}
                          </Link>
                        </h2>
                        <span className="text-xs font-normal text-muted-foreground">
                          Saved {formatDate(repo.savedAt.toISOString())}
                        </span>
                      </div>

                      <p className="text-muted-foreground mb-2">
                        {repo.description}
                      </p>

                      {repo.notes && (
                        <div className="bg-muted/50 rounded-md p-3 mb-3">
                          <p className="text-sm">
                            <span className="font-semibold">Your notes:</span>{" "}
                            {repo.notes}
                          </p>
                        </div>
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
                            {formatNumber(repo.stars)}
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
                            {formatNumber(repo.forks)}
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
                      className="btn btn-ghost btn-sm flex-1 flex items-center justify-center text-destructive"
                      onClick={() => handleRemoveRepository(repo.fullName)}
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}