// @/app/api/repositories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchQualityRepos, processRepositoriesData, checkRateLimit } from '@/lib/github-api';
import { getRepositories, storeRepositories, getRepositoriesCount, isRepositoryStale } from '@/lib/repository-service';
import { auth } from '@/auth';
import { getPersonalizedRepositories } from '@/lib/deepseek-service';

export const runtime = 'nodejs'; // 'edge' is not supported by Prisma

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
import prisma from '@/prisma/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const language = url.searchParams.get("language") || "all";
    const topicFilter = url.searchParams.get("topic") || "all";
    const beginnerFriendly = url.searchParams.get("beginner") === "true";

    // Get user session to personalize results and use their GitHub token
    const session = await auth();
    let userToken: string | null = null;

    // CORRECTED: Securely fetch the access token from the database if the user is logged in
    if (session?.user?.id) {
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: "github",
        },
      });
      userToken = account?.access_token || null;
    }

    // Build filter based on query parameters
    const filter: any = {};

    if (language !== "all") {
      filter.language = language;
    }

    if (topicFilter !== "all") {
      filter.topics = [topicFilter];
    }

    if (beginnerFriendly) {
      filter.skillLevel = "beginner";
    }

    // Fetch repositories from database
    const dbRepositories = await getRepositories(page, limit, filter);

    let newRepos: any[] = [];
    let rateLimited = false;
    let rateLimitMessage = "";

    if (dbRepositories.length < limit || page === 1) {
      try {
        const hasQuota = await checkRateLimit(userToken);

        if (!hasQuota) {
          rateLimited = true;
          rateLimitMessage =
            "GitHub API rate limit exceeded. Showing cached results.";
        } else {
          try {
            const githubRepos = await fetchQualityRepos(
              page,
              "",
              beginnerFriendly,
              // Corrected: Ensure null is converted to undefined
              userToken || undefined
            );
            newRepos = await processRepositoriesData(githubRepos.slice(0, 5), {
              maxRepos: 5,
              // Corrected: Ensure null is converted to undefined
              userToken: userToken || undefined,
            });

            if (newRepos.length > 0) {
              await storeRepositories(newRepos);
            }
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes("rate limit exceeded")
            ) {
              rateLimited = true;
              rateLimitMessage =
                "GitHub API rate limit exceeded. Showing cached results.";
            } else {
              console.error("Error fetching repositories from GitHub:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error checking rate limit:", error);
        rateLimited = true;
        rateLimitMessage =
          "Unable to check GitHub API rate limit. Showing cached results.";
      }
    }

    const existingRepoIds = new Set(dbRepositories.map((repo) => repo.repoId));
    const uniqueNewRepos = newRepos.filter(
      (repo) => !existingRepoIds.has(repo.id)
    );

    let allRepos: any[] = [...dbRepositories]; // Ensure allRepos is typed correctly
    if (uniqueNewRepos.length > 0) {
      const formattedNewRepos = uniqueNewRepos.map((repo) => ({
        id: repo.id.toString(),
        repoId: repo.id,
        name: repo.name,
        owner: typeof repo.owner === "object" ? repo.owner.login : repo.owner,
        fullName: repo.fullName,
        description: repo.description,
        language: repo.language,
        stars: parseInt(
          repo.stars.replace(/[kM]/, (m: string) =>
            m === "k" ? "000" : "000000"
          )
        ),
        forks: parseInt(
          repo.forks.replace(/[kM]/, (m: string) =>
            m === "k" ? "000" : "000000"
          )
        ),
        issues: parseInt(
          repo.issuesCount.replace(/[kM]/, (m: string) =>
            m === "k" ? "000" : "000000"
          )
        ),
        ownerAvatar: repo.ownerAvatar,
        topics: repo.topics,
        size: repo.size,
        url: `https://github.com/${repo.fullName}`,
        homepage: repo.homepage,
        license: repo.license,
        createdAt: new Date(repo.createdAt),
        updatedAt: new Date(repo.updatedAt),
        lastFetchedAt: new Date(),
      }));

      allRepos = [...allRepos, ...formattedNewRepos];
    }

    if (session?.user?.id) {
      try {
        const userPreferences = {
          interests: [] as string[],
          skillLevel: beginnerFriendly ? "beginner" : "intermediate",
          looking: beginnerFriendly ? ["Beginner Friendly"] : [],
          preferredLanguages: language !== "all" ? [language] : [],
        };

        if (topicFilter !== "all") {
          userPreferences.interests.push(topicFilter);
        }

        const userProfile = await getGitHubUserProfile(session.user.id);

        allRepos = await getPersonalizedRepositories(
          allRepos,
          userProfile,
          userPreferences,
          limit
        );
      } catch (error) {
        console.error("Error personalizing repositories:", error);
      }
    }

    const totalCount = await getRepositoriesCount(filter);
    const hasMore = totalCount > page * limit || uniqueNewRepos.length > 0;

    return NextResponse.json({
      repositories: allRepos.slice(0, limit),
      totalCount,
      page,
      limit,
      hasMore,
      rateLimited,
      message: rateLimitMessage,
      fromCache: uniqueNewRepos.length === 0,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
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
    const session = await auth();
    
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