// app/api/db-test/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// This ensures the route is always run dynamically
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Attempting to connect to the database in test route...");
    const userCount = await prisma.user.count();
    console.log(`Successfully fetched user count: ${userCount}`);
    return NextResponse.json({
      success: true,
      message: `Database connection successful. Found ${userCount} users.`,
    });
  } catch (error) {
    console.error("Database connection failed in test route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to the database.",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
