import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { Suspense } from "react";
import { auth } from "@/auth";
import { headers } from "next/headers";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; error?: string };
}) {
  // Get the current session and error parameters
  const session = await auth();
  const callbackUrl = searchParams?.callbackUrl || "/dashboard";
  const error = searchParams?.error;
  
  // Log request headers for debugging
  const headersList = headers();
  const referer = headersList.get('referer') || 'No referer';
  const userAgent = headersList.get('user-agent') || 'No user-agent';
  
  console.log("Login page accessed", { 
    referer, 
    userAgent, 
    hasSession: !!session,
    callbackUrl,
    error
  });

  return (
    <div className="container relative min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto py-12 px-6 bg-card rounded-xl border border-border shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary mb-4">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Welcome to SourceSeekr</h1>
          <p className="text-sm text-muted-foreground text-center">
            Sign in to get personalized repository recommendations
          </p>
        </div>
          
          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 rounded-lg flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Authentication Error</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error === "OAuthSignin" && "Error starting the GitHub sign-in process. Please try again."}
                  {error === "OAuthCallback" && "Error during the GitHub callback. This could be due to a configuration issue or network problem."}
                  {error === "OAuthCreateAccount" && "Error creating your account with GitHub credentials."}
                  {error === "OAuthAccountNotLinked" && "This email is already associated with a different account or provider."}
                  {error === "SessionRequired" && "You need to be signed in to access this page."}
                  {error === "Callback" && "Error during the sign-in callback. Please try again or contact support."}
                  {error === "logout_failed" && "Failed to completely log out. Please try clearing your browser cache."}
                  {!["OAuthSignin", "OAuthCallback", "OAuthCreateAccount", "OAuthAccountNotLinked", "SessionRequired", "Callback", "logout_failed"].includes(error) && 
                    `Authentication error (${error}). Please try again or contact support if the issue persists.`}
                </p>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                  <Link href="/" className="underline hover:text-primary">Return to home page</Link> or try signing in again after a few minutes.
                </p>
              </div>
            </div>
          )}
          
          <div className="grid gap-6">
            <Suspense fallback={<div className="flex justify-center"><span className="loading loading-spinner"></span></div>}>
              <LoginForm callbackUrl={callbackUrl} hasExistingSession={!!session} />
            </Suspense>
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
   
  );
}
