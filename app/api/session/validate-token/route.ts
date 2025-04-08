import { verifyGitHubToken } from '@/lib/github-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to validate a GitHub token
 * This allows client-side code to check if a token is valid without exposing it
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "No token provided" 
        },
        { status: 400 }
      );
    }

    // Verify token with GitHub API
    const validation = await verifyGitHubToken(token);

    return NextResponse.json(validation);
  } catch (error) {
    console.error("Error validating token:", error);
    
    return NextResponse.json(
      { 
        valid: false, 
        error: error instanceof Error ? error.message : "Unknown error validating token" 
      }, 
      { status: 500 }
    );
  }
}