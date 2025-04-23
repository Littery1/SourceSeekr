import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHeaders } from "@/lib/github-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const limit = searchParams.get("limit") || "10";

    // Validate required parameters
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo parameters are required" },
        { status: 400 }
      );
    }

    // Get the current session to extract GitHub token if available
    const session = await auth();
    const userToken = (session as any)?.accessToken || null;

    // Make the GitHub API request with the user's token
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${limit}`,
      { headers: getHeaders(userToken) }
    );

    // Handle API errors
    if (!res.ok) {
      if (res.status === 403) {
        console.error("GitHub API rate limit exceeded");
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `GitHub API error: ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    // Parse and return the response
    const contributors = await res.json();

    return NextResponse.json({ contributors });
  } catch (error) {
    console.error("Error fetching GitHub contributors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributors" },
      { status: 500 }
    );
  }
}