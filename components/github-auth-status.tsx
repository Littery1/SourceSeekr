"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function GitHubAuthStatus() {
  const { data: session, status } = useSession();
  const [authStatus, setAuthStatus] = useState<{
    isChecking: boolean;
    isAuthenticated: boolean;
    hasToken: boolean;
    isTokenValid: boolean;
    scopes: string[] | null;
    error: string | null;
  }>({
    isChecking: true,
    isAuthenticated: false,
    hasToken: false,
    isTokenValid: false,
    scopes: null,
    error: null,
  });

  useEffect(() => {
    const checkGitHubAuth = async () => {
      // Only check if the user session is loaded and authenticated
      if (status !== "authenticated") {
        setAuthStatus((prev) => ({
          ...prev,
          isChecking: false,
          isAuthenticated: false,
        }));
        return;
      }

      try {
        // Call our secure API route to validate the token
        const res = await fetch("/api/auth/validate-token");
        const data = await res.json();

        setAuthStatus({
          isChecking: false,
          isAuthenticated: data.isAuthenticated,
          hasToken: !!data.scopes, // A good proxy for having a token
          isTokenValid: data.isValid,
          scopes: data.scopes || null,
          error: data.error || null,
        });
      } catch (error) {
        setAuthStatus({
          isChecking: false,
          isAuthenticated: true, // We know they have a session
          hasToken: false, // Assume token is missing or invalid on fetch error
          isTokenValid: false,
          scopes: null,
          error:
            error instanceof Error
              ? error.message
              : "Client-side error checking GitHub authentication",
        });
      }
    };

    // The check will run once the session status is determined
    if (status !== "loading") {
      checkGitHubAuth();
    }
  }, [status]);

  if (status === "loading" || authStatus.isChecking) {
    return (
      <div className="p-4 text-sm bg-gray-100 dark:bg-gray-800 rounded-md">
        Checking GitHub API authentication...
      </div>
    );
  }

  if (!authStatus.isAuthenticated) {
    return (
      <div className="p-4 text-sm bg-red-100 dark:bg-red-900 rounded-md">
        Not signed in. Please log in to access GitHub API features.
      </div>
    );
  }

  if (!authStatus.isTokenValid) {
    return (
      <div className="p-4 text-sm bg-yellow-100 dark:bg-yellow-900 rounded-md">
        GitHub token is invalid or expired. Please log out and log in again.
        {authStatus.error && <p className="mt-2 text-xs">{authStatus.error}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 text-sm bg-green-100 dark:bg-green-900 rounded-md">
      GitHub API authentication successful.
      <div className="mt-2 text-xs">
        <p>GitHub scopes: {authStatus.scopes?.join(", ") || "None"}</p>
      </div>
    </div>
  );
}
