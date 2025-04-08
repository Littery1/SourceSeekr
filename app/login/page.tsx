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
            <div className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {error === "OAuthSignin" && "Error starting sign in"}
                {error === "OAuthCallback" && "Error during callback"}
                {error === "OAuthAccountNotLinked" && "Email already used with different provider"}
                {error === "CredentialsSignin" && "Invalid credentials"}
                {!["OAuthSignin", "OAuthCallback", "OAuthAccountNotLinked", "CredentialsSignin"].includes(error) && "Authentication error"}
              </span>
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
