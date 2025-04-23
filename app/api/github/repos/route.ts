import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import * as githubAPI from '@/lib/github-api';

/**
 * API endpoint to proxy GitHub repository API requests
 * This allows client-side code to make GitHub API requests without CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get the query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const name = searchParams.get('name');
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'repository';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    
    // Get the user's session and GitHub token
    const session = await auth();
    const githubToken = session?.user?.githubAccessToken || null;
    
    // Check which type of request we need to make
    if (type === 'repository' && owner && name) {
      // Fetch specific repository
      const repo = await githubAPI.fetchRepositoryByFullName(owner, name, githubToken);
      return NextResponse.json({ success: true, data: repo });
    } 
    else if (type === 'search' && query) {
      try {
        // Fix malformed query strings - common cause of 422 errors
        const sanitizedQuery = query.trim().replace(/\s+/g, '+');
        
        // Search repositories
        const repos = await githubAPI.searchRepositories(sanitizedQuery, page, githubToken);
        
        if (!repos || repos.length === 0) {
          // Return empty results rather than processing nothing
          return NextResponse.json({ 
            success: true, 
            data: [],
            message: "No repositories found matching your query" 
          });
        }
        
        const processedRepos = await githubAPI.processRepositoriesData(repos.slice(0, limit), {
          maxRepos: limit,
          userToken: githubToken
        });
        
        return NextResponse.json({ success: true, data: processedRepos });
      } catch (searchError) {
        console.error("Search query error:", searchError);
        
        // Return empty results for search errors rather than failing completely
        return NextResponse.json({ 
          success: false, 
          data: [],
          error: searchError instanceof Error ? searchError.message : "Error processing search query" 
        }, { status: 400 });
      }
    }
    else if (type === 'trending') {
      // Get trending repos
      const repos = await githubAPI.fetchTrendingRepos(page, githubToken);
      const processedRepos = await githubAPI.processRepositoriesData(repos.slice(0, limit), {
        maxRepos: limit,
        userToken: githubToken
      });
      return NextResponse.json({ success: true, data: processedRepos });
    }
    else if (type === 'popular') {
      try {
        // Get popular repos with error handling
        const repos = await githubAPI.fetchQualityRepos(page, githubToken);
        
        if (!repos || repos.length === 0) {
          // Return empty array rather than trying to process nothing
          return NextResponse.json({ 
            success: true, 
            data: [],
            message: "No popular repositories found" 
          });
        }
        
        const processedRepos = await githubAPI.processRepositoriesData(repos.slice(0, limit), {
          maxRepos: limit,
          userToken: githubToken,
          skipContributors: true,  // Skip these to avoid potential API errors
          skipIssues: true,        // Skip these to avoid potential API errors
          skipPullRequests: true   // Skip these to avoid potential API errors
        });
        
        return NextResponse.json({ success: true, data: processedRepos });
      } catch (error) {
        console.error("Error fetching popular repositories:", error);
        
        // Return empty results for search errors rather than failing completely
        return NextResponse.json({ 
          success: false, 
          data: [],
          error: error instanceof Error ? error.message : "Error fetching popular repositories" 
        }, { status: 400 });
      }
    }
    else {
      // Invalid request
      return NextResponse.json({ success: false, error: 'Invalid request parameters' }, { status: 400 });
    }
  } catch (error) {
    console.error("Error with GitHub API proxy:", error);
    
    // Check if it's a rate limit error
    if (error instanceof githubAPI.GitHubRateLimitError) {
      return NextResponse.json({ 
        success: false, 
        error: 'GitHub API rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }
    
    // Auth error
    if (error instanceof githubAPI.GitHubAuthError) {
      return NextResponse.json({ 
        success: false, 
        error: 'GitHub API authentication failed. Please login again.' 
      }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error with GitHub API" 
      }, 
      { status: 500 }
    );
  }
}