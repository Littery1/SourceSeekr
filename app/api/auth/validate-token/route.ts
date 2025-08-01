import { NextResponse } from "next/server";
import { auth } from "@/auth";
// --- Direct Prisma/Neon Initialization for this API Route ---
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";
const neon = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaNeon(neon);
const prisma = new PrismaClient({ adapter });
// --- End Initialization ---

export const dynamic = "force-dynamic";

async function verifyToken(
  accessToken: string
): Promise<{ valid: boolean; scopes?: string[]; error?: string }> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return { valid: false, error: `GitHub API error: ${response.statusText}` };
  }

  const scopes = response.headers.get("x-oauth-scopes")?.split(", ") || [];
  return { valid: true, scopes };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        isAuthenticated: false,
        isValid: false,
        error: "Not authenticated",
      },
      { status: 401 }
    );
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "github",
    },
  });

  if (!account?.access_token) {
    return NextResponse.json({
      isAuthenticated: true,
      isValid: false,
      error: "GitHub account not linked or access token missing.",
    });
  }

  const validation = await verifyToken(account.access_token);

  return NextResponse.json({
    isAuthenticated: true,
    isValid: validation.valid,
    scopes: validation.scopes,
    error: validation.error || null,
  });
}
