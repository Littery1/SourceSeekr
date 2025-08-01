console.log(
  "SERVER_STARTUP: GITHUB_TOKEN is:",
  process.env.GITHUB_TOKEN ? "Loaded" : "MISSING"
);
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as githubAPI from "@/lib/github-api";
import prisma from "@/lib/prisma"; // Import the Prisma client

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// app/api/github/repos/route.ts

async function getToken() {
  const session = await auth();
  if (session?.user?.id) {
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
    });
    if (account?.access_token) {
      console.log("✅ Using user's session access token for GitHub API.");
      return account.access_token;
    }
  }

  // This is the fallback for requests when the user is not logged in.
  const appToken = process.env.GITHUB_TOKEN;
  if (appToken) {
    console.log("✅ Using app's GITHUB_TOKEN for GitHub API.");
  } else {
    // This is the error condition. If you see this, your .env.local is wrong.
    console.error(
      "❌ CRITICAL: GITHUB_TOKEN is not loaded from .env.local file."
    );
  }
  return appToken || null;
}

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

    const githubToken = await getToken();

    // Check which type of request we need to make
    if (type === "repository" && owner && name) {
      // Fetch specific repository
      const repo = await githubAPI.fetchRepositoryByFullName(
        owner,
        name,
        githubToken
      );
      return NextResponse.json({ success: true, repository: repo, data: repo });
    } else if ((type === "search" || q) && query) {
      const sanitizedQuery = query.trim();
      const headers = githubAPI.getHeaders(githubToken);
      const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
        sanitizedQuery
      )}&sort=${sort}&order=${order}&per_page=${limit}&page=${page}`;

      const response = await fetch(apiUrl, { headers });

      await githubAPI.handleGitHubApiResponse(response); // Handle errors

      const data = await response.json();
      return NextResponse.json({
        success: true,
        repositories: data.items || [],
        data: data.items || [],
        total_count: data.total_count || 0,
      });
    } else if (type === "trending") {
      const repos = await githubAPI.fetchTrendingRepos(page, githubToken);
      return NextResponse.json({
        success: true,
        repositories: repos,
        data: repos,
      });
    } else if (type === "popular") {
      const repos = await githubAPI.fetchQualityRepos(
        page,
        "",
        false,
        githubToken
      );
      return NextResponse.json({
        success: true,
        repositories: repos,
        data: repos,
      });
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
          error:
            "GitHub API authentication failed. Please check your GITHUB_TOKEN.",
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
