'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getGitHubToken } from '@/lib/auth-utils';

export default function GitHubAuthStatus() {
  const { data: session } = useSession();
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
    error: null
  });

  useEffect(() => {
    const checkGitHubAuth = async () => {
      if (!session || !session.user) {
        setAuthStatus({
          isChecking: false,
          isAuthenticated: false,
          hasToken: false,
          isTokenValid: false,
          scopes: null,
          error: "Not signed in"
        });
        return;
      }

      try {
        // Check if the token exists and is valid
        const { token, isValid, error } = await getGitHubToken(session);
        
        setAuthStatus({
          isChecking: false,
          isAuthenticated: !!session.user,
          hasToken: !!token,
          isTokenValid: isValid,
          scopes: session.user.githubTokenScopes || null,
          error: error || null
        });
      } catch (error) {
        setAuthStatus({
          isChecking: false,
          isAuthenticated: !!session.user,
          hasToken: !!session.user.githubAccessToken,
          isTokenValid: false,
          scopes: session.user.githubTokenScopes || null,
          error: error instanceof Error ? error.message : "Error checking GitHub authentication"
        });
      }
    };

    checkGitHubAuth();
  }, [session]);

  if (authStatus.isChecking) {
    return <div className="p-4 text-sm bg-gray-100 dark:bg-gray-800 rounded-md">
      Checking GitHub API authentication...
    </div>;
  }

  if (!authStatus.isAuthenticated) {
    return <div className="p-4 text-sm bg-red-100 dark:bg-red-900 rounded-md">
      Not signed in. Please log in to access GitHub API features.
    </div>;
  }

  if (!authStatus.hasToken) {
    return <div className="p-4 text-sm bg-yellow-100 dark:bg-yellow-900 rounded-md">
      Signed in, but no GitHub token found. Please reconnect your GitHub account.
    </div>;
  }

  if (!authStatus.isTokenValid) {
    return <div className="p-4 text-sm bg-yellow-100 dark:bg-yellow-900 rounded-md">
      GitHub token is invalid or expired. Please log out and log in again.
      {authStatus.error && <p className="mt-2 text-xs">{authStatus.error}</p>}
    </div>;
  }

  return (
    <div className="p-4 text-sm bg-green-100 dark:bg-green-900 rounded-md">
      GitHub API authentication successful.
      <div className="mt-2 text-xs">
        <p>GitHub scopes: {authStatus.scopes?.join(', ') || 'None'}</p>
      </div>
    </div>
  );
}