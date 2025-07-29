import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as githubAPI from "@/lib/github-api";
import prisma from "@/prisma/prisma"; // Import the Prisma client

export const dynamic = "force-dynamic";

/**
 * API endpoint to proxy GitHub repository API requests
 * This allows client-side code to make GitHub API requests without CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get the query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const name = searchParams.get("name");
    const q = searchParams.get("q"); // Direct query parameter
    const query = searchParams.get("query") || q; // Support both query and q
    const type = searchParams.get("type") || "repository";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sort = searchParams.get("sort") || "stars";
    const order = searchParams.get("order") || "desc";

    const session = await auth();
    let githubToken: string | null = null;

    // CORRECTED: Securely fetch the user's token from the database
    if (session?.user?.id) {
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: "github",
        },
      });

      if (account?.access_token) {
        githubToken = account.access_token;
      }
    }

    // Check which type of request we need to make
    if (type === "repository" && owner && name) {
      // Fetch specific repository
      const repo = await githubAPI.fetchRepositoryByFullName(
        owner,
        name,
        githubToken
      );
      // NOTE: The `fetchRepositoryByFullName` function in github-api.ts returns a `ProcessedRepo`
      // which is already in the right format. The client side expects `repository`.
      return NextResponse.json({ success: true, repository: repo, data: repo }); // Pass as 'repository' and 'data'
    } else if ((type === "search" || q) && query) {
      try {
        const sanitizedQuery = query.trim();
        const headers = githubAPI.getHeaders(githubToken);
        const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
          sanitizedQuery
        )}&sort=${sort}&order=${order}&per_page=${limit}&page=${page}`;

        console.log(`Making GitHub API request: ${apiUrl}`);

        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
          console.error(
            `GitHub API error: ${response.status} - ${response.statusText}`
          );
          throw new Error(
            `GitHub API error: ${response.status} - ${response.statusText}`
          );
        }

        const data = await response.json();
        return NextResponse.json({
          success: true,
          repositories: data.items || [],
          data: data.items || [],
          total_count: data.total_count || 0,
        });
      } catch (searchError) {
        console.error("Search query error:", searchError);

        try {
          const fallbackQuery = "stars:>50";
          const headers = githubAPI.getHeaders(githubToken);
          const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
            fallbackQuery
          )}&sort=stars&order=desc&per_page=${limit}&page=1`;

          console.log(`Making fallback GitHub API request: ${apiUrl}`);

          const response = await fetch(apiUrl, { headers });

          if (!response.ok) {
            return NextResponse.json(
              {
                success: false,
                repositories: [],
                error: "Failed to fetch repositories even with fallback query",
              },
              { status: 500 }
            );
          }

          const data = await response.json();
          return NextResponse.json({
            success: true,
            repositories: data.items || [],
            data: data.items || [],
            total_count: data.total_count || 0,
            fallback: true,
          });
        } catch (fallbackError) {
          return NextResponse.json(
            {
              success: false,
              repositories: [],
              error: "All GitHub API requests failed",
            },
            { status: 500 }
          );
        }
      }
    } else if (type === "trending") {
      const repos = await githubAPI.fetchTrendingRepos(page, githubToken);
      return NextResponse.json({
        success: true,
        repositories: repos,
        data: repos,
      });
    } else if (type === "popular") {
      try {
        const repos = await githubAPI.fetchQualityRepos(
          page,
          "",
          false,
          githubToken
        );

        if (!repos || repos.length === 0) {
          return NextResponse.json({
            success: true,
            repositories: [],
            data: [],
            message: "No popular repositories found",
          });
        }

        return NextResponse.json({
          success: true,
          repositories: repos,
          data: repos,
        });
      } catch (error) {
        console.error("Error fetching popular repositories:", error);

        return NextResponse.json(
          {
            success: false,
            repositories: [],
            error:
              error instanceof Error
                ? error.message
                : "Error fetching popular repositories",
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error with GitHub API proxy:", error);

    if (error instanceof githubAPI.GitHubRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub API rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    if (error instanceof githubAPI.GitHubAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub API authentication failed. Please login again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error with GitHub API",
      },
      { status: 500 }
    );
  }
}
