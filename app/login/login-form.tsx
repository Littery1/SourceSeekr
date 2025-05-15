"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

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
  const [sessionDetected, setSessionDetected] = useState(hasExistingSession);
  
  // Update session detection if session status changes
  useEffect(() => {
    if (status === 'authenticated' && session) {
      setSessionDetected(true);
    }
  }, [session, status]);

  // Handle signing out and switching accounts - improved implementation
  const handleSwitchAccount = async () => {
    try {
      // Show loading toast
      toast.loading("Signing out...");
      console.log("Starting sign out process");
      
      // Add timestamp for cache busting
      const timestamp = Date.now();
      const callbackUrl = `/login?t=${timestamp}`;
      
      // Call our custom GitHub logout endpoint for better reliability
      const logoutUrl = `/api/auth/github-logout?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      
      console.log("Redirecting to logout URL:", logoutUrl);
      window.location.href = logoutUrl;
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
      // Fallback - redirect to login page even if there was an error
      window.location.href = `/login?error=signout_failed&t=${Date.now()}`;
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setSubmitting(true);
      
      // Add detailed logging
      console.log("Login attempt - Current session state:", { 
        status, 
        sessionDetected, 
        callbackUrl,
        timestamp: new Date().toISOString() 
      });
      
      // If there's an existing session, just use the switch account function
      if (sessionDetected) {
        console.log("Existing session detected, using switch account flow");
        await handleSwitchAccount();
        return; // Stop execution here as we're redirecting
      }
      
      console.log("Starting GitHub sign in flow");
      
      // Add cache-busting to the callbackUrl
      const timestamp = Date.now();
      const effectiveCallbackUrl = `${callbackUrl || '/dashboard'}?t=${timestamp}`;
      console.log("Using callback URL with timestamp:", effectiveCallbackUrl);
      
      try {
        // Allow NextAuth to handle the redirect - simpler and more reliable
        await signIn("github", { 
          callbackUrl: effectiveCallbackUrl,
          redirect: true
        });
      } catch (signInError) {
        console.error("Error during signIn:", signInError);
        // Fall back to manual redirect
        window.location.href = `/api/auth/signin/github?callbackUrl=${encodeURIComponent(effectiveCallbackUrl)}`;
        return;
      }
      
      // The code below will only execute if there was a client-side error before the redirect
      console.log("WARNING: Code after signIn executed - this shouldn't happen with redirect: true");
      
    } catch (error: any) {
      // This will only catch client-side errors, not server-side issues
      console.error("Critical client-side error during GitHub login:", error);
      setSubmitting(false);
      toast.error("A critical error occurred while trying to connect to GitHub. Please try again.");
    }
  };

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
            onClick={() => {
              // Add cache-busting parameter to prevent caching issues
              const timestamp = Date.now();
              const url = callbackUrl.includes('?') 
                ? `${callbackUrl}&t=${timestamp}` 
                : `${callbackUrl}?t=${timestamp}`;
              router.push(url);
            }}
          >
            Continue with current account
          </button>
          
          <button 
            className="btn btn-outline" 
            onClick={handleSwitchAccount}
            disabled={submitting}
          >
            {submitting ? "Signing out..." : "Switch to a different account"}
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