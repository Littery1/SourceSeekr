'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch environment info from the test API
    const fetchEnvInfo = async () => {
      try {
        const res = await fetch('/api/auth/test');
        const data = await res.json();
        setEnvInfo(data);
      } catch (err) {
        setError('Failed to fetch environment info');
        console.error(err);
      }
    };

    fetchEnvInfo();
  }, []);

  const handleGithubLogin = async () => {
    try {
      await signIn('github', { callbackUrl: '/auth-test' });
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in with GitHub');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="p-4 bg-muted rounded-md">
            <p><strong>Status:</strong> {status}</p>
            {status === 'authenticated' && session ? (
              <div className="mt-4">
                <div className="flex items-center gap-4 mb-4">
                  {session.user?.image && (
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      width={50} 
                      height={50} 
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p><strong>Provider:</strong> {(session.user as any)?.provider || 'Unknown'}</p>
                  {(session.user as any)?.githubUsername && (
                    <p><strong>GitHub Username:</strong> {(session.user as any).githubUsername}</p>
                  )}
                </div>
                
                <button 
                  onClick={() => signOut({ callbackUrl: '/auth-test' })}
                  className="btn btn-sm btn-error mt-4"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <p>You are not signed in</p>
                <button 
                  onClick={handleGithubLogin}
                  className="btn btn-sm btn-primary mt-2"
                >
                  Sign in with GitHub
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
          {error && (
            <div className="alert alert-error mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {envInfo ? (
            <div className="p-4 bg-muted rounded-md overflow-auto max-h-[400px]">
              <h3 className="text-lg font-medium mb-2">GitHub OAuth</h3>
              <ul className="space-y-1 mb-4">
                <li><strong>Configured:</strong> {envInfo.authProviders.github.configured ? '✅' : '❌'}</li>
                <li><strong>Client ID:</strong> {envInfo.authProviders.github.idPrefix}</li>
                <li><strong>Secret Available:</strong> {envInfo.authProviders.github.secretAvailable ? '✅' : '❌'}</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2">NextAuth</h3>
              <ul className="space-y-1 mb-4">
                <li><strong>Secret:</strong> {envInfo.nextAuth.secret ? '✅' : '❌'}</li>
                <li><strong>URL:</strong> {envInfo.nextAuth.url}</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2">Database</h3>
              <ul className="space-y-1">
                <li><strong>URL:</strong> {envInfo.database.urlPrefix}</li>
                <li><strong>Connection:</strong> {envInfo.database.url ? '✅' : '❌'}</li>
              </ul>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="loading loading-spinner"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <Link href="/login" className="btn btn-secondary">
          Go to Login Page
        </Link>
      </div>
    </div>
  );
}