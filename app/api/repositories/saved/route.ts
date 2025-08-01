import { NextRequest, NextResponse } from "next/server";
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
export const runtime = "nodejs"; // 'edge' is not supported by Prisma

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedRepos = await prisma.savedRepository.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        repository: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ repositories: savedRepos });
  } catch (error) {
    console.error("Error fetching saved repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved repositories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { repo, notes } = await req.json();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!repo || !repo.id) {
      return NextResponse.json(
        { error: "Repository data is required" },
        { status: 400 }
      );
    }

    const ownerLogin =
      typeof repo.owner === "string" ? repo.owner : repo.owner?.login || "";

    // More robustly handle star/fork/issue counts
    const safeParse = (value: any) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const num = parseFloat(
          value.toLowerCase().replace("k", "e3").replace("m", "e6")
        );
        return isNaN(num) ? 0 : Math.round(num);
      }
      return 0;
    };

    const stars = safeParse(repo.stargazers_count ?? repo.stars);
    const forks = safeParse(repo.forks_count ?? repo.forks);
    const issues = safeParse(repo.open_issues_count ?? repo.issuesCount);
    const ownerAvatar = repo.ownerAvatar || repo.owner?.avatar_url || "";
    const fullName = repo.fullName || repo.full_name;

    const savedOrUpdatedRepo = await prisma.repository.upsert({
      where: { repoId: repo.id },
      update: {
        stars,
        forks,
        issues,
        lastFetchedAt: new Date(),
      },
      create: {
        repoId: repo.id,
        owner: ownerLogin,
        name: repo.name,
        fullName: fullName,
        description: repo.description || "",
        language: repo.language,
        stars,
        forks,
        issues,
        ownerAvatar,
        topics: repo.topics || [],
        size: repo.size || 0,
        url: repo.html_url || `https://github.com/${fullName}`,
        homepage: repo.homepage,
        license: repo.license,
      },
    });

    const savedRepoLink = await prisma.savedRepository.create({
      data: {
        userId: session.user.id,
        repositoryId: savedOrUpdatedRepo.id, // Use the UUID from our database
        notes,
      },
    });

    return NextResponse.json({ success: true, data: savedRepoLink });
  } catch (error: any) {
    console.error("Error saving repository:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Repository already saved" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save repository" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fullName = searchParams.get("fullName");

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fullName) {
      return NextResponse.json(
        { error: "Repository fullName is required" },
        { status: 400 }
      );
    }

    const repository = await prisma.repository.findUnique({
      where: {
        fullName: fullName,
      },
    });

    if (!repository) {
      // If it's not in our main repo table, it can't be saved.
      // This is an edge case, but good to handle.
      return NextResponse.json({
        success: true,
        message: "Repository not found to delete.",
      });
    }

    await prisma.savedRepository.delete({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId: repository.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved repository:", error);
    return NextResponse.json(
      { error: "Failed to delete saved repository" },
      { status: 500 }
    );
  }
}
