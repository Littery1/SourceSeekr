import { NextResponse } from "next/server";

export async function GET() {
  // Check GitHub OAuth environment variables
  const githubId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID;
  const githubSecret = process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET;
  
  const status = {
    environment: process.env.NODE_ENV,
    authProviders: {
      github: {
        configured: !!githubId && !!githubSecret,
        idAvailable: !!githubId,
        secretAvailable: !!githubSecret,
        // Don't expose actual secrets, just whether they're set
        idPrefix: githubId ? githubId.substring(0, 4) + "..." : "Not set",
        secretLength: githubSecret ? githubSecret.length : 0
      }
    },
    nextAuth: {
      secret: !!process.env.AUTH_SECRET || !!process.env.NEXTAUTH_SECRET,
      url: process.env.NEXTAUTH_URL || "Not set"
    },
    database: {
      url: !!process.env.DATABASE_URL,
      urlPrefix: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.split("@")[0].split("://")[0] + "://*****" 
        : "Not set"
    }
  };

  return NextResponse.json(status);
}