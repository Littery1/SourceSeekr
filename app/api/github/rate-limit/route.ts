import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import * as githubAPI from '@/lib/github-api';

/**
 * API endpoint to check GitHub rate limit
 * This allows client-side code to check rate limit without CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const githubToken = session?.user?.githubAccessToken || process.env.GITHUB_TOKEN || null;
    
    // Check rate limit with GitHub API using the token
    const hasQuota = await githubAPI.checkRateLimit(githubToken);
    
    return NextResponse.json({ 
      success: true,
      hasQuota,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error checking GitHub rate limit:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        hasQuota: false,
        error: error instanceof Error ? error.message : "Unknown error checking rate limit" 
      }, 
      { status: 500 }
    );
  }
}