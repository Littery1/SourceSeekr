"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface Props {
  className?: string;
  name: string;
  description: string | null;
  stars: string;
  forks: string;
  pullRequests: string;
  issuesCount: string;
  issues: string[];
  language: string | null;
  ownerAvatar: string;
  contributors: { avatar_url: string; contributions: number; login?: string }[];
  owner?: string;
  fullName?: string;
  topics?: string[];
}

export const Repository = ({
  className,
  name,
  description,
  stars,
  forks,
  pullRequests,
  issuesCount,
  issues,
  language,
  ownerAvatar,
  contributors,
  owner,
  fullName,
  topics,
}: Props) => {
  const { data: session, status } = useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Make sure we have valid strings for the repo name parts
  const fullNameStr = typeof fullName === 'string' ? fullName : '';
  const nameStr = typeof name === 'string' ? name : '';
  const ownerStr = typeof owner === 'string' ? owner : '';
  
  const repoNameParts = fullNameStr ? fullNameStr.split('/') : nameStr.split('/');
  const repoOwner = ownerStr || (repoNameParts.length > 1 ? repoNameParts[0] : '');
  const repoName = repoNameParts.length > 1 ? repoNameParts[1] : nameStr;
  const completeFullName = `${repoOwner}/${repoName}`;
  
  // Check if repository is already saved when component mounts
  useEffect(() => {
    const checkIfSaved = async () => {
      if (status === "authenticated") {
        try {
          const response = await fetch(`/api/repositories/saved?search=${encodeURIComponent(completeFullName)}`);
          const data = await response.json();
          
          if (response.ok && data.repositories) {
            // If we find any repositories matching this fullname for the current user, it's saved
            const matchingRepo = data.repositories.find(
              (repo: any) => repo.fullName === completeFullName
            );
            setIsSaved(!!matchingRepo);
          }
        } catch (error) {
          console.error("Error checking if repository is saved:", error);
        }
      }
    };
    
    checkIfSaved();
  }, [status, completeFullName]);
  
  const toggleSave = async () => {
    if (status !== "authenticated") {
      toast.error("Please sign in to save repositories");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSaved) {
        // Find the saved repository ID first
        const response = await fetch(`/api/repositories/saved?search=${encodeURIComponent(completeFullName)}`);
        const data = await response.json();
        
        if (response.ok && data.repositories) {
          const savedRepo = data.repositories.find(
            (repo: any) => repo.fullName === completeFullName
          );
          
          if (savedRepo) {
            // Delete the saved repository
            const deleteResponse = await fetch(`/api/repositories/saved?id=${savedRepo.id}`, {
              method: "DELETE",
            });
            
            if (deleteResponse.ok) {
              setIsSaved(false);
              toast.success("Repository removed from saved list");
            } else {
              const errorData = await deleteResponse.json();
              toast.error(errorData.error || "Failed to remove repository");
            }
          }
        }
      } else {
        // Save the repository
        const response = await fetch("/api/repositories/saved", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner: repoOwner,
            name: repoName,
            fullName: completeFullName,
            description,
            language,
            stars: parseInt(stars.replace(/[^\d]/g, '')) || 0,
            forks: parseInt(forks.replace(/[^\d]/g, '')) || 0,
            issues: parseInt(issuesCount.replace(/[^\d]/g, '')) || 0,
            ownerAvatar,
            url: `https://github.com/${completeFullName}`,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setIsSaved(true);
          toast.success("Repository saved successfully");
        } else if (response.status === 409) {
          // Repository already saved
          setIsSaved(true);
          toast.success("Repository is already saved");
        } else {
          toast.error(data.error || "Failed to save repository");
        }
      }
    } catch (error) {
      console.error("Error toggling save status:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort contributors by activity (contributions) and limit to top five
  const topContributors = contributors
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 5);

  return (
    <div className={`card hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Image
            src={ownerAvatar}
            width={40}
            height={40}
            alt={`${repoOwner} avatar`}
            className="rounded-full border border-border"
          />
          <div>
            <Link 
              href={`/repository/${String(repoOwner)}/${String(repoName)}`}
              className="font-medium text-lg hover:text-primary transition-colors duration-200"
            >
              {repoName}
            </Link>
            <div className="text-sm text-muted-foreground">
              by <span className="hover:text-primary transition-colors duration-200">{repoOwner}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={toggleSave}
          className="focus:outline-none relative" 
          aria-label={isSaved ? "Unsave repository" : "Save repository"}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : isSaved ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary">
              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors duration-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-sm text-foreground/80 mb-3 line-clamp-2 min-h-[40px]">
        {description || "No description provided"}
      </p>
      
      {/* Topics */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {topics.slice(0, 3).map((topic) => (
            <span 
              key={topic} 
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              {topic}
            </span>
          ))}
          {topics.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              +{topics.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-5">
        {language && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span className="text-sm">{language}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{stars}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
            <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{forks}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
            <path fillRule="evenodd" d="M4.75 12c0-1.5.75-2.25 2.25-2.25h14.25v4.5H7a2.25 2.25 0 01-2.25-2.25zM3 7.75A.75.75 0 013.75 7h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 7.75zM3 16.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{pullRequests}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{issuesCount}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {topContributors.map((contributor, index) => (
            <div key={index} className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-card">
              <Image
                src={contributor.avatar_url}
                alt={`Contributor ${index + 1}`}
                className="object-cover"
                fill
                sizes="32px"
              />
            </div>
          ))}
          {contributors.length > 5 && (
            <div className="relative w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-card">
              +{contributors.length - 5}
            </div>
          )}
        </div>
        
        <Link 
          href={`/repository/${String(repoOwner)}/${String(repoName)}`}
          className="btn btn-outline btn-sm"
        >
          Details
        </Link>
      </div>
    </div>
  );
};