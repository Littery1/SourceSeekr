// @/app/api/repositories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchQualityRepos, processRepositoriesData, checkRateLimit } from '@/lib/github-api';
import { getRepositories, storeRepositories, getRepositoriesCount, isRepositoryStale } from '@/lib/repository-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getPersonalizedRepositories } from '@/lib/deepseek-service';

// Mock function for getting GitHub user profile data
// In a real implementation, this would fetch data from GitHub API
async function getGitHubUserProfile(userId: string) {
  try {
    // This would fetch from GitHub API
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'github'
      }
    });

    if (!account) {
      return null;
    }

    // This is just placeholder data
    // In a real implementation, we would use account.access_token to fetch actual data
    return {
      username: 'user123',
      name: 'User Name',
      bio: 'I am a developer',
      followers: 10,
      following: 20,
      popularRepos: [
        { name: 'project1', language: 'JavaScript', stars: 10, description: 'A sample project' }
      ],
      languages: [
        { language: 'JavaScript', percentage: 60 },
        { language: 'TypeScript', percentage: 30 },
        { language: 'Python', percentage: 10 }
      ],
      contributions: [
        { language: 'JavaScript', count: 100 },
        { language: 'TypeScript', count: 50 }
      ]
    };
  } catch (error) {
    console.error('Error fetching GitHub user profile:', error);
    return null;
  }
}

// Import Prisma client for database operations
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const language = url.searchParams.get('language') || 'all';
    const topicFilter = url.searchParams.get('topic') || 'all';
    const beginnerFriendly = url.searchParams.get('beginner') === 'true';
    
    // Get user session to personalize results and use their GitHub token
    const session = await getServerSession(authOptions);
    // Extract GitHub token from session if available
    const userToken = session?.user?.githubAccessToken;
    
    // Build filter based on query parameters
    const filter: any = {};
    
    if (language !== 'all') {
      filter.language = language;
    }
    
    if (topicFilter !== 'all') {
      filter.topics = [topicFilter];
    }
    
    if (beginnerFriendly) {
      filter.skillLevel = 'beginner';
    }
    
    // Fetch repositories from database
    const dbRepositories = await getRepositories(page, limit, filter);
    
    // Variable to hold new repositories we might fetch
    let newRepos: any[] = [];
    let rateLimited = false;
    let rateLimitMessage = "";
    
    // Check if we need to fetch more repositories from GitHub
    // We might need to if:
    // 1. We have fewer repositories than requested
    // 2. We're on the first page (to ensure fresh data)
    if (dbRepositories.length < limit || page === 1) {
      try {
        // Check for rate limiting
        const hasQuota = await checkRateLimit();
        
        if (!hasQuota) {
          rateLimited = true;
          rateLimitMessage = "GitHub API rate limit exceeded. Showing cached results.";
        } else {
          // We have quota, fetch new repositories
          try {
            // Get repositories from GitHub API (using user token if available)
            const githubRepos = await fetchQualityRepos(page, userToken);
            // Process repositories to our format (limit to 5 to avoid excessive API calls)
            newRepos = await processRepositoriesData(githubRepos.slice(0, 5), {
              maxRepos: 5,
              userToken
            });
            
            // Store new repositories in database
            if (newRepos.length > 0) {
              await storeRepositories(newRepos);
            }
          } catch (error) {
            // Handle rate limiting errors
            if (error instanceof Error && error.message.includes("rate limit exceeded")) {
              rateLimited = true;
              rateLimitMessage = "GitHub API rate limit exceeded. Showing cached results.";
            } else {
              console.error("Error fetching repositories from GitHub:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error checking rate limit:", error);
        rateLimited = true;
        rateLimitMessage = "Unable to check GitHub API rate limit. Showing cached results.";
      }
    }
    
    // Combine database repositories with newly fetched ones
    // Make sure we don't duplicate repositories
    const existingRepoIds = new Set(dbRepositories.map(repo => repo.repoId));
    const uniqueNewRepos = newRepos.filter(repo => !existingRepoIds.has(repo.id));
    
    // Construct combined repositories list
    let allRepos = [...dbRepositories];
    if (uniqueNewRepos.length > 0) {
      // Convert new repos to our database format for consistency
      const formattedNewRepos = uniqueNewRepos.map(repo => ({
        id: repo.id.toString(), // Convert to string for consistency
        repoId: repo.id,
        name: repo.name,
        owner: repo.owner,
        fullName: repo.fullName,
        description: repo.description,
        language: repo.language,
        stars: parseInt(repo.stars.replace('k', '000').replace('M', '000000')),
        forks: parseInt(repo.forks.replace('k', '000').replace('M', '000000')),
        issues: parseInt(repo.issuesCount.replace('k', '000').replace('M', '000000')),
        ownerAvatar: repo.ownerAvatar,
        topics: repo.topics,
        size: repo.size,
        url: `https://github.com/${repo.fullName}`,
        homepage: repo.homepage,
        license: repo.license,
        createdAt: new Date(repo.createdAt),
        updatedAt: new Date(repo.updatedAt),
        lastFetchedAt: new Date()
      }));
      
      allRepos = [...allRepos, ...formattedNewRepos];
    }
    
    // Use DeepSeek to personalize repositories if user is logged in
    if (session?.user?.id) {
      try {
        // Get user preferences
        // Attempt to get preferences from the database
        // For now we're using a hardcoded approach, this should be replaced with actual user preferences
        // from a dedicated user_preferences table in the database
        const userPreferences = {
          interests: [],
          skillLevel: beginnerFriendly ? 'beginner' : 'intermediate',
          looking: beginnerFriendly ? ['Beginner Friendly'] : [],
          preferredLanguages: language !== 'all' ? [language] : []
        };
        
        if (topicFilter !== 'all') {
          userPreferences.interests.push(topicFilter);
        }
        
        // Get GitHub profile data
        const userProfile = await getGitHubUserProfile(session.user.id);
        
        // Personalize repositories with DeepSeek
        allRepos = await getPersonalizedRepositories(
          allRepos,
          userProfile,
          userPreferences,
          limit
        );
      } catch (error) {
        console.error("Error personalizing repositories:", error);
        // Continue with unpersonalized repositories
      }
    }
    
    // Calculate hasMore
    const totalCount = await getRepositoriesCount(filter);
    const hasMore = totalCount > page * limit || uniqueNewRepos.length > 0;
    
    // Return repositories
    return NextResponse.json({
      repositories: allRepos.slice(0, limit),
      totalCount,
      page,
      limit,
      hasMore,
      rateLimited,
      message: rateLimitMessage,
      fromCache: uniqueNewRepos.length === 0
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, repositoryId, notes } = await req.json();
    
    // Validate input
    if (!userId || !repositoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user session for authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Import the saveRepository function
    const { saveRepository } = await import('@/lib/repository-service');
    
    // Save the repository for the user
    await saveRepository(userId, repositoryId, notes);
    
    return NextResponse.json({
      success: true,
      message: 'Repository saved successfully'
    });
  } catch (error) {
    console.error('Error saving repository:', error);
    return NextResponse.json(
      { error: 'Failed to save repository' },
      { status: 500 }
    );
  }
}