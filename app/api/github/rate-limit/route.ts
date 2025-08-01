import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as githubAPI from "@/lib/github-api";
import prisma from "@/prisma/prisma"; // Import the Prisma client

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API endpoint to check GitHub rate limit
 * This allows client-side code to check rate limit without CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    let githubToken: string | null = null;

    // If the user is logged in, securely fetch their token from the database
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

    // If no user token, fall back to the app's token for unauthenticated checks
    if (!githubToken) {
      githubToken = process.env.GITHUB_TOKEN || null;
    }

    // Check rate limit with GitHub API using the determined token
    const hasQuota = await githubAPI.checkRateLimit(githubToken);

    return NextResponse.json({
      success: true,
      hasQuota,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking GitHub rate limit:", error);

    return NextResponse.json(
      {
        success: false,
        hasQuota: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error checking rate limit",
      },
      { status: 500 }
    );
  }
}
