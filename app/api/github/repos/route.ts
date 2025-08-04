// app/api/github/repos/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as githubAPI from "@/lib/github-api";
import prisma from "@/lib/prisma"; // Use the single, serverless-safe client

// Vercel Route Segment Config: Force this route to be dynamic
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to get the correct token for the GitHub API
async function getToken() {
  const session = await auth();
  // If the user is logged in, try to get their personal access token
  if (session?.user?.id) {
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
    });
    if (account?.access_token) {
      return account.access_token;
    }
  }
  // For unauthenticated users or users without a linked token, use the app's global token
  return process.env.GITHUB_TOKEN || null;
}

/**
 * API endpoint to proxy GitHub repository API requests.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const name = searchParams.get("name");
    const q = searchParams.get("q");
    const query = searchParams.get("query") || q;
    const type = searchParams.get("type") || "repository";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sort = searchParams.get("sort") || "stars";
    const order = searchParams.get("order") || "desc";

    const githubToken = await getToken();

    // Route requests based on the 'type' parameter
    if (type === "repository" && owner && name) {
      const repo = await githubAPI.fetchRepositoryByFullName(
        owner,
        name,
        githubToken
      );
      return NextResponse.json({ success: true, repository: repo, data: repo });
    }

    if ((type === "search" || q) && query) {
      const repos = await githubAPI.searchRepositories(
        query,
        page,
        githubToken
      );
      return NextResponse.json({
        success: true,
        repositories: repos,
        data: repos,
        total_count: repos.length, // Note: Simplified count
      });
    }

    if (type === "trending") {
      const repos = await githubAPI.fetchTrendingRepos(page, githubToken);
      return NextResponse.json({
        success: true,
        repositories: repos,
        data: repos,
      });
    }

    if (type === "popular") {
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
    }

    // If no valid type matches, return a bad request error
    return NextResponse.json(
      { success: false, error: "Invalid request parameters" },
      { status: 400 }
    );
  } catch (error) {
    // This block catches any errors from the API calls and returns a proper JSON response
    console.error("Error in GitHub API proxy route:", error);

    if (error instanceof githubAPI.GitHubRateLimitError) {
      return NextResponse.json(
        { success: false, error: "GitHub API rate limit exceeded." },
        { status: 429 }
      );
    }

    if (error instanceof githubAPI.GitHubAuthError) {
      return NextResponse.json(
        { success: false, error: "GitHub API authentication failed." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
