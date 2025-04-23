import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import * as githubAPI from '@/lib/github-api';

export const dynamic = "force-dynamic";

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
    const q = searchParams.get('q');  // Direct query parameter
    const query = searchParams.get('query') || q;  // Support both query and q
    const type = searchParams.get('type') || 'repository';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || 'stars';
    const order = searchParams.get('order') || 'desc';
    
    // Get the user's session and GitHub token
    const session = await auth();
    // Get GitHub token from user session
    const githubToken = session?.user?.githubAccessToken || null;
    
    // Check which type of request we need to make
    if (type === 'repository' && owner && name) {
      // Fetch specific repository
      const repo = await githubAPI.fetchRepositoryByFullName(owner, name, githubToken);
      return NextResponse.json({ success: true, repository: repo });
    } 
    else if ((type === 'search' || q) && query) {
      try {
        // Fix malformed query strings - common cause of 422 errors
        const sanitizedQuery = query.trim();
        
        // Make the GitHub API request
        const headers = githubAPI.getHeaders(githubToken);
        const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(sanitizedQuery)}&sort=${sort}&order=${order}&per_page=${limit}&page=${page}`;
        
        console.log(`Making GitHub API request: ${apiUrl}`);
        
        const response = await fetch(apiUrl, { headers });
        
        if (!response.ok) {
          console.error(`GitHub API error: ${response.status} - ${response.statusText}`);
          throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        return NextResponse.json({ 
          success: true, 
          repositories: data.items || [],
          data: data.items || [],  // Add data property for backward compatibility
          total_count: data.total_count || 0
        });
      } catch (searchError) {
        console.error("Search query error:", searchError);
        
        // Try a fallback simpler query if the original failed
        try {
          const fallbackQuery = "stars:>50";
          const headers = githubAPI.getHeaders(githubToken);
          const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(fallbackQuery)}&sort=stars&order=desc&per_page=${limit}&page=1`;
          
          console.log(`Making fallback GitHub API request: ${apiUrl}`);
          
          const response = await fetch(apiUrl, { headers });
          
          if (!response.ok) {
            return NextResponse.json({ 
              success: false, 
              repositories: [],
              error: "Failed to fetch repositories even with fallback query"
            }, { status: 500 });
          }
          
          const data = await response.json();
          return NextResponse.json({ 
            success: true, 
            repositories: data.items || [],
            total_count: data.total_count || 0,
            fallback: true
          });
        } catch (fallbackError) {
          return NextResponse.json({ 
            success: false, 
            repositories: [],
            error: "All GitHub API requests failed"
          }, { status: 500 });
        }
      }
    }
    else if (type === 'trending') {
      // Get trending repos
      const repos = await githubAPI.fetchTrendingRepos(page, githubToken);
      return NextResponse.json({ 
        success: true, 
        repositories: repos,
        data: repos  // Add data property for backward compatibility
      });
    }
    else if (type === 'popular') {
      try {
        // Get popular repos with error handling
        const repos = await githubAPI.fetchQualityRepos(page, '', false, githubToken);
        
        if (!repos || repos.length === 0) {
          // Return empty array
          return NextResponse.json({ 
            success: true, 
            repositories: [],
            data: [],  // Add data property for backward compatibility
            message: "No popular repositories found" 
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          repositories: repos,
          data: repos  // Add data property for backward compatibility
        });
      } catch (error) {
        console.error("Error fetching popular repositories:", error);
        
        // Return empty results
        return NextResponse.json({ 
          success: false, 
          repositories: [],
          error: error instanceof Error ? error.message : "Error fetching popular repositories" 
        }, { status: 500 });
      }
    }
    else {
      // Invalid request
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request parameters' 
      }, { status: 400 });
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