// / root page

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { ProcessedRepo } from "@/lib/github-api";

// Repository Carousel Component
const PopularRepositoriesCarousel = () => {
  const [repos, setRepos] = useState<ProcessedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [savedRepos, setSavedRepos] = useState<Set<string>>(new Set());

  const { data: session } = useSession();
  
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

    loadSavedRepos();

    // Fetch popular repositories
    const fetchRepos = async () => {
      try {
        setLoading(true);

        // Use our server-side API to avoid CORS issues
        const response = await fetch('/api/github/repos?type=popular&limit=5');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setRepos(data.data);
        } else {
          console.error("Error in API response:", data.error);
          setRepos([]);
        }
      } catch (error) {
        console.error("Error fetching repositories:", error);
        // Fallback data in case of error
        setRepos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [session]);

  const nextRepo = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % repos.length);
  };

  const prevRepo = () => {
    setDirection(-1);
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + repos.length) % repos.length
    );
  };

  const toggleSaveRepo = (repoId: string) => {
    try {
      const newSavedRepos = new Set(savedRepos);

      if (newSavedRepos.has(repoId)) {
        newSavedRepos.delete(repoId);
        toast.success("Repository removed from saved items");
      } else {
        newSavedRepos.add(repoId);
        toast.success("Repository saved successfully");
      }

      setSavedRepos(newSavedRepos);
      localStorage.setItem(
        "sourceseekr-saved",
        JSON.stringify([...newSavedRepos])
      );
    } catch (error) {
      console.error("Error saving repository:", error);
      toast.error("Failed to save repository");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading repositories...</p>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          No repositories found. Please try again later.
        </p>
      </div>
    );
  }

  const currentRepo = repos[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="overflow-hidden rounded-xl relative min-h-[400px]">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <div className="bg-card rounded-xl border border-border shadow-lg p-6 h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={currentRepo.ownerAvatar}
                    width={56}
                    height={56}
                    alt={`${currentRepo.owner} avatar`}
                    className="rounded-full border-2 border-primary/20"
                  />
                  <div>
                    <Link
                      href={`/repository/${currentRepo.owner}/${currentRepo.name}`}
                      className="font-medium text-xl hover:text-primary transition-colors"
                    >
                      {currentRepo.name}
                    </Link>
                    <div className="text-sm text-muted-foreground hover:text-foreground/80 transition-colors">
                      by{" "}
                      <span className="hover:text-primary transition-colors">
                        {currentRepo.owner}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label={
                    savedRepos.has(currentRepo.id.toString())
                      ? "Remove from saved"
                      : "Save repository"
                  }
                  onClick={() => toggleSaveRepo(currentRepo.id.toString())}
                  className={`text-muted-foreground hover:text-primary transition-colors group relative`}
                  title={
                    savedRepos.has(currentRepo.id.toString())
                      ? "Remove from saved"
                      : "Save repository"
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={
                      savedRepos.has(currentRepo.id.toString())
                        ? "currentColor"
                        : "none"
                    }
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                    />
                  </svg>
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card text-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {savedRepos.has(currentRepo.id.toString())
                      ? "Remove from saved"
                      : "Save repository"}
                  </span>
                </button>
              </div>

              <p className="text-foreground/80 mb-6 min-h-[4rem]">
                {currentRepo.description}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                {currentRepo.language && (
                  <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span>{currentRepo.language}</span>
                  </div>
                )}

                {currentRepo.topics &&
                  currentRepo.topics.slice(0, 3).map((topic: string) => (
                    <div
                      key={topic}
                      className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-sm"
                    >
                      #{topic}
                    </div>
                  ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
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
                    <span className="text-lg font-semibold">
                      {currentRepo.stars}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Stars</span>
                </div>

                <div className="flex flex-col items-center p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-muted-foreground"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-lg font-semibold">
                      {currentRepo.forks}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Forks</span>
                </div>

                <div className="flex flex-col items-center p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-muted-foreground"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-lg font-semibold">
                      {currentRepo.issuesCount}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Issues</span>
                </div>
              </div>

              <div className="flex justify-between">
                <Link
                  href={`/repository/${currentRepo.owner}/${currentRepo.name}`}
                  className="btn btn-primary flex-1 mr-2"
                >
                  View Details
                </Link>
                <a
                  href={`https://github.com/${currentRepo.owner}/${currentRepo.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline flex-1 ml-2"
                >
                  GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={prevRepo}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-card border border-border rounded-full p-3 shadow-lg hover:bg-muted transition-colors z-10"
        aria-label="Previous repository"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
      </button>

      <button
        onClick={nextRepo}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-card border border-border rounded-full p-3 shadow-lg hover:bg-muted transition-colors z-10"
        aria-label="Next repository"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </button>

      <div className="flex justify-center mt-8">
        {repos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`w-3 h-3 mx-1 rounded-full ${
              index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Component to handle search params (this will be wrapped in Suspense)
function AuthErrorHandler() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      switch (error) {
        case "OAuthSignin":
          toast.error("Error starting GitHub sign in. Please try again.");
          break;
        case "OAuthCallback":
          toast.error("Error during GitHub authentication.");
          break;
        case "OAuthAccountNotLinked":
          toast.error("This email is already linked to a different account.");
          break;
        case "OAuthSignout":
          toast.error("Error signing out. Please try again.");
          break;
        case "CredentialsSignin":
          toast.error("Invalid login credentials.");
          break;
        default:
          toast.error("Authentication error occurred. Please try again.");
      }

      // Clear the error from URL without page refresh
      const newURL = new URL(window.location.href);
      newURL.searchParams.delete("error");
      window.history.replaceState({}, "", newURL.toString());
    }
  }, [searchParams]);
  
  return null;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  const [mounted, setMounted] = useState(false);

  // Add this useEffect to handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll events for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Apply parallax effect to elements with parallax classes
      document.documentElement.style.setProperty(
        "--parallax-y",
        `${window.scrollY * -0.1}px`
      );

      // Add animations to elements as they come into view
      const animateElements = document.querySelectorAll(".animate-on-scroll");
      animateElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const windowHeight =
          window.innerHeight || document.documentElement.clientHeight;

        if (rect.top <= windowHeight * 0.85) {
          element.classList.add("animate-slide-in-up");
          element.classList.remove("opacity-0");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Repository card component
  interface Repository {
    id: number;
    name: string;
    owner: string;
    ownerAvatar: string;
    description: string;
    language?: string;
    stars: number;
    forks: number;
    issues: number;
  }

  const RepositoryCard = ({ repo }: { repo: Repository }) => (
    <div className="repo-card group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <Image
            src={repo.ownerAvatar}
            width={44}
            height={44}
            alt={`${repo.owner} avatar`}
            className="rounded-full border-2 border-primary/20 transition-all duration-200 group-hover:border-primary/60"
          />
          <div>
            <Link
              href={`/repository/${repo.owner}/${repo.name}`}
              className="font-medium text-lg hover:text-primary transition-colors duration-200"
            >
              {repo.name}
            </Link>
            <div className="text-sm text-muted-foreground hover:text-foreground/80 transition-colors">
              by{" "}
              <span className="hover:text-primary transition-colors duration-200">
                {repo.owner}
              </span>
            </div>
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
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
            />
          </svg>
        </button>
      </div>

      <p className="text-sm text-foreground/80 mb-4 line-clamp-2 min-h-[2.5rem]">
        {repo.description}
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        {repo.language && (
          <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
            <span>{repo.language}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3.5 h-3.5 text-amber-400"
          >
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
          <span>{repo.stars}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3.5 h-3.5 text-muted-foreground"
          >
            <path
              fillRule="evenodd"
              d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
              clipRule="evenodd"
            />
          </svg>
          <span>{repo.forks}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full text-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3.5 h-3.5 text-muted-foreground"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>{repo.issues}</span>
        </div>
      </div>

      <Link
        href={`/repository/${repo.owner}/${repo.name}`}
        className="btn btn-outline w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        View Details
      </Link>
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      {/* Wrapped search params usage in Suspense boundary */}
      <Suspense fallback={null}>
        <AuthErrorHandler />
      </Suspense>
      
      {/* Background Elements for Visual Interest */}
      {mounted ? (
        <>
          <div className="blurred-circle w-[500px] h-[500px] top-[-100px] right-[-150px] opacity-50"></div>
          <div className="blurred-circle w-[600px] h-[600px] bottom-[20%] left-[-200px] opacity-40"></div>
          <div className="blurred-square w-[400px] h-[400px] top-[30%] right-[-100px] opacity-30"></div>
        </>
      ) : null}
      {/* Hero Section with Parallax */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center overflow-hidden"
      >
        {/* Animated Code Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background/30 z-10"></div>
          <pre className="absolute text-xs text-primary/10 whitespace-pre-wrap opacity-30 transform rotate-12 top-[-100px] left-[-50px] w-[200%] pointer-events-none">
            {`
import { useState, useEffect } from 'react';
import { octokit } from './github';

export async function fetchRepositories(language, stars, page = 1) {
  try {
    const query = \`language:\${language} stars:>\${stars}\`;
    const results = await octokit.rest.search.repos({
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: 10,
      page
    });
    
    return results.data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      owner: {
        login: repo.owner.login,
        avatar: repo.owner.avatar_url
      }
    }));
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw new Error('Failed to fetch repositories');
  }
}

function App() {
  const [repos, setRepos] = useState<ProcessedRepo[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    async function loadRepos() {
      setLoading(true);
      try {
        const data = await fetchRepositories('javascript', 1000);
        setRepos(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRepos();
  }, []);
  
  return (
    <div className="app">
      <header>
        <h1>SourceSeekr</h1>
        <p>Find the perfect GitHub repositories for you</p>
      </header>
      
      <main>
        {loading ? (
          <div className="loading">Loading repositories...</div>
        ) : (
          <div className="repo-grid">
            {repos.map(repo => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
            `}
          </pre>
        </div>

        {/* Main Hero Content */}
        <div className="container mx-auto px-4 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3 space-y-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                Discover Your Perfect{" "}
                <span className="gradient-text">GitHub Repositories</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
                SourceSeekr uses AI to match you with repositories that align
                with your interests, skills, and goals. Sign in with GitHub and
                get personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {session ? (
                  <Link
                    href="/dashboard"
                    className="btn btn-primary px-8 py-3 text-base"
                  >
                    Get Your Recommendations
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="btn btn-primary px-8 py-3 text-base"
                  >
                    Sign in with GitHub
                  </Link>
                )}
                <Link
                  href="/about"
                  className="btn btn-outline px-8 py-3 text-base"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* 3D Visualization */}
            <div className="lg:col-span-2 relative">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl -z-10 transform -rotate-3"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary/20 to-secondary/5 rounded-2xl -z-10 transform rotate-3"></div>

                <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-primary/20 bg-card">
                  <div className="absolute top-0 left-0 right-0 h-10 bg-muted flex items-center px-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-xs text-center flex-1 text-muted-foreground">
                      sourceseekr-visualization.tsx
                    </div>
                  </div>

                  <div className="pt-12 p-4 animate-float text-xs sm:text-sm">
                    <pre className="font-mono text-foreground/80 whitespace-pre-wrap">
                      {`// 3D Repository Visualization
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useRef, useState } from 'react';

const RepositoryNode = ({ position, size, color, name, onClick }) => {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={position}>
      <mesh
        ref={ref}
        scale={hovered ? size * 1.1 : size}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      <Html position={[0, size + 0.5, 0]}>
        <div className="text-white text-center bg-black bg-opacity-50 px-2 py-1 rounded">
          {name}
        </div>
      </Html>
    </group>
  );
};

export default function RepositoryVisualization({ 
  repositories, 
  onSelectRepository 
}) {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={100} depth={50} count={5000} factor={4} />
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        enableRotate={true} 
      />
      {repositories.map((repo, i) => (
        <RepositoryNode
          key={repo.id}
          position={[
            Math.sin(i * (Math.PI * 2) / repositories.length) * 7,
            Math.cos(i * (Math.PI * 2) / repositories.length) * 7,
            0
          ]}
          size={repo.stars / 10000 + 0.5}
          color={repo.language === 'JavaScript' ? '#f1e05a' : 
                 repo.language === 'TypeScript' ? '#2b7489' : 
                 repo.language === 'Python' ? '#3572A5' : '#6e5494'}
          name={repo.name}
          onClick={() => onSelectRepository(repo)}
        />
      ))}
    </Canvas>
  );
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
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
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Use SourceSeekr?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform connects you with the perfect GitHub repositories
              using advanced AI and data analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Recommendations",
                description:
                  "Our AI analyzes your skills, interests, and programming habits to find repositories that match what you're looking for.",
                icon: (
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
                ),
              },
              {
                title: "Detailed Analytics",
                description:
                  "View comprehensive statistics and visualizations for repositories, including contributions, issues, and activity trends.",
                icon: (
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
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>
                ),
              },
              {
                title: "Interactive AI Chat",
                description:
                  "Chat with our AI assistant to get repository recommendations, programming advice, and GitHub user information.",
                icon: (
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
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                ),
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="card flex flex-col items-center text-center p-8 opacity-0 animate-on-scroll"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="bg-primary/10 p-4 rounded-full mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Repositories */}
      <section className="py-20 bg-muted/30 border-y border-border relative">
        <div
          className="absolute inset-0 overflow-hidden -z-10"
          style={{
            transform: `translateY(${scrollY * 0.05}px)`,
          }}
        >
          <div className="absolute w-full h-[200%] animate-wave">
            {mounted &&
              Array.from({ length: 10 }).map((_, index) => {
                // Generate values only once after mounting
                const circleStyle = {
                  width: `${Math.random() * 300 + 100}px`,
                  height: `${Math.random() * 300 + 100}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.3,
                };

                return (
                  <div
                    key={index}
                    className="absolute blurred-circle"
                    style={circleStyle}
                  ></div>
                );
              })}
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 opacity-0 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Popular Repositories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore top-rated repositories from the GitHub community
            </p>
          </div>

          <PopularRepositoriesCarousel />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How SourceSeekr Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple process to get personalized repository recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line between steps */}
            <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-[80%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

            {[
              {
                title: "Connect with GitHub",
                description:
                  "Sign in with your GitHub account to let us understand your interests and skills",
                icon: (
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
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                    />
                  </svg>
                ),
                step: "01",
              },
              {
                title: "Customize Your Profile",
                description:
                  "Set your preferences, including languages, interests, and skill level",
                icon: (
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
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                ),
                step: "02",
              },
              {
                title: "Get Recommendations",
                description:
                  "Receive personalized repository suggestions based on your profile and preferences",
                icon: (
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
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                ),
                step: "03",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="relative z-10 opacity-0 animate-on-scroll"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="card flex flex-col items-center text-center p-8 relative">
                  <div className="absolute -top-5 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10">
                    {step.step}
                  </div>
                  <div className="bg-primary/10 p-4 rounded-full mb-6 mt-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card border border-primary/20 rounded-2xl p-8 md:p-12 shadow-lg opacity-0 animate-on-scroll">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Find Your Perfect Repository?
              </h2>
              <p className="text-lg text-muted-foreground">
                Sign in with GitHub and start discovering repositories that
                match your interests and skills.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="btn btn-primary px-8 py-3 text-base"
                >
                  Get Recommendations
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-primary px-8 py-3 text-base"
                >
                  Sign in with GitHub
                </Link>
              )}
              <Link
                href="/about"
                className="btn btn-outline px-8 py-3 text-base"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
