import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as githubAPI from "@/lib/github-api";
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
    const rateLimitStatus = await githubAPI.checkRateLimit(token);

    return NextResponse.json({
      success: true,
      hasQuota: rateLimitStatus,
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
