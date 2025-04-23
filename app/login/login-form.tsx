"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { clearAuthState } from '@/lib/auth-utils';

export type LoginFormProps = {
  callbackUrl?: string;
  hasExistingSession?: boolean;
};

export const LoginForm = ({ 
  callbackUrl = "/dashboard", 
  hasExistingSession = false 
}: LoginFormProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [submitting, setSubmitting] = useState(false);
  // We no longer need this state for email login
  const [sessionDetected, setSessionDetected] = useState(hasExistingSession);
  
  // We don't need forms anymore as we're only using GitHub login

  // Update session detection if session status changes
  useEffect(() => {
    if (status === 'authenticated' && session) {
      setSessionDetected(true);
    }
  }, [session, status]);

  // Handle clearing existing session
  const handleClearSession = async () => {
    try {
      // Use our utility function to clear auth state
      await clearAuthState('/login');
      
      // If the page hasn't reloaded already, show a success message
      toast.success("Previous session cleared. You can now sign in with a different account.");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to clear previous session. Please try again.");
      
      // Fallback to client-side signOut
      await signOut({ redirect: true, callbackUrl: '/login' });
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setSubmitting(true);
      
      // If there's an existing session, clear it completely (including GitHub's session)
      if (sessionDetected) {
        // First make sure local session is cleared
        await clearAuthState();
        
        // Then redirect to GitHub logout, which will redirect back to login
        window.location.href = '/api/auth/github-logout?callbackUrl=/login';
        return; // Stop execution here as we're redirecting
      }
      
      console.log("Starting GitHub sign in with callback URL:", callbackUrl);
      
      // Use GitHub signin - with cleaner parameters
      await signIn("github", { 
        callbackUrl
      });
      
      // The above will redirect, so any code below won't execute on success
    } catch (error: any) {
      console.error("GitHub login error:", error);
      setSubmitting(false);
      toast.error(error.message || "Failed to log in with GitHub");
    }
  };

  // No longer needed - using only GitHub auth

  // If a session is detected, show warning and option to switch accounts
  if (sessionDetected) {
    const currentUser = session?.user?.name || session?.user?.email || "your account";
    
    return (
      <div className="flex flex-col space-y-6 w-full">
        <div className="alert alert-info" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">You&apos;re already signed in</h3>
            <p className="text-sm">
              You&apos;re currently signed in as <span className="font-medium">{currentUser}</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            className="btn btn-primary" 
            onClick={() => router.push(callbackUrl)}
          >
            Continue with current account
          </button>
          
          <button 
            className="btn btn-outline" 
            onClick={handleClearSession}
          >
            Switch to a different account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <button
          className="btn btn-primary w-full flex justify-center items-center gap-3"
          onClick={handleGitHubLogin}
          disabled={submitting}
        >
          <Image
            src="/images/github.svg"
            alt="GitHub Logo"
            width={24}
            height={24}
          />
          {submitting ? "Signing in..." : "Sign in with GitHub"}
        </button>

        <div className="text-xs text-center text-muted-foreground">
          <span>Having trouble? </span>
          <Link 
            href="https://github.com/settings/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            Clear GitHub OAuth Applications
          </Link>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t want to sign in? You can still{" "}
          <Link
            href="/explore"
            className="text-primary hover:text-primary/80 font-medium"
          >
            explore repositories
          </Link>{" "}
          without an account.
        </p>
      </div>
    </div>
  );
};
