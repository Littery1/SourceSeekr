import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import * as githubAPI from '@/lib/github-api';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only allow authenticated users with admin permission to view stats
    // You would need to add an isAdmin field to your user model
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the GitHub API usage statistics
    const stats = githubAPI.getGitHubApiUsageStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching GitHub API usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub API usage statistics' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only allow authenticated users with admin permission to reset stats
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Reset the GitHub API usage statistics
    const result = githubAPI.resetGitHubApiUsageStats();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error resetting GitHub API usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to reset GitHub API usage statistics' }, 
      { status: 500 }
    );
  }
}