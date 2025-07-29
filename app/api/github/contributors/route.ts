import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHeaders } from "@/lib/github-api";
import prisma from "@/prisma/prisma"; // Import the Prisma client

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Although this is a public endpoint, authenticated users get a higher rate limit.
    let userToken: string | null = null;

    if (session?.user?.id) {
      // Securely fetch the user's account details from the database
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: "github",
        },
      });

      if (account?.access_token) {
        userToken = account.access_token;
      }
    }

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

    // Make the GitHub API request with the user's token (if available)
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${limit}`,
      { headers: getHeaders(userToken) } // getHeaders will use the userToken or a fallback
    );

    // Handle API errors
    if (!res.ok) {
      if (res.status === 403) {
        console.error("GitHub API rate limit exceeded or forbidden");
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded or forbidden" },
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
