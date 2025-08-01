import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHeaders } from "@/lib/github-api";
import prisma from "@/prisma/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Helper function to get the correct token
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
      return account.access_token;
    }
  }
  // Fallback to the app's token for unauthenticated requests
  return process.env.GITHUB_TOKEN || null;
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken();
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const limit = searchParams.get("limit") || "10";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Owner and repo parameters are required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${limit}`,
      { headers: getHeaders(token) }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

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
