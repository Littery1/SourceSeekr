import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET handler to fetch all saved repositories for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get("language");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build the filters
    const filters: any = {
      userId: session.user.id,
    };

    // Add language filter if provided
    if (language && language !== "all") {
      // Join with Repository to filter by language
      filters.repository = {
        language: language,
      };
    }

    // Add search filter if provided
    if (search) {
      filters.OR = [
        { repository: { name: { contains: search, mode: "insensitive" } } },
        { repository: { owner: { contains: search, mode: "insensitive" } } },
        {
          repository: {
            description: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Fetch repositories with filters and include repository data
    const savedRepos = await prisma.savedRepository.findMany({
      where: filters,
      include: {
        repository: true, // Include the related repository data
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Format the response data
    const formattedRepos = savedRepos.map((savedRepo) => ({
      id: savedRepo.id,
      name: savedRepo.repository.name,
      owner: savedRepo.repository.owner,
      fullName: `${savedRepo.repository.owner}/${savedRepo.repository.name}`,
      description: savedRepo.repository.description,
      language: savedRepo.repository.language,
      stars: savedRepo.repository.stars.toString(),
      forks: savedRepo.repository.forks.toString(),
      issues: savedRepo.repository.issues.toString(),
      ownerAvatar: savedRepo.repository.ownerAvatar,
      url: savedRepo.repository.url,
      notes: savedRepo.notes,
      savedAt: savedRepo.createdAt,
    }));

    return NextResponse.json({ repositories: formattedRepos });
  } catch (error) {
    console.error("Error fetching saved repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved repositories" },
      { status: 500 }
    );
  }
}

// POST handler to save a new repository
export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const {
      owner,
      name,
      fullName,
      description,
      language,
      stars,
      forks,
      issues,
      ownerAvatar,
      url,
    } = body;

    // Validate required fields
    if (!owner || !name || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if repository is already saved
    const existingRepo = await prisma.savedRepository.findFirst({
      where: {
        userId: session.user.id,
        repository: {
          owner,
          name,
        },
      },
      include: {
        repository: true,
      },
    });

    if (existingRepo) {
      return NextResponse.json(
        {
          error: "Repository already saved",
          repository: existingRepo,
        },
        { status: 409 }
      );
    }

    // Create or find the repository record first
    const repository = await prisma.repository.upsert({
      where: {
        repoId: body.repoId,
      },
      update: {
        fullName: `${owner}/${name}`, // Add missing required field
        repoId: body.repoId,
        description,
        language,
        stars: stars ? parseInt(stars) : 0,
        forks: forks ? parseInt(forks) : 0,
        issues: issues ? parseInt(issues) : 0,
        ownerAvatar,
        url,
      },
      create: {
        owner,
        name,
        fullName: `${owner}/${name}`, // Add missing required field
        repoId: body.repoId,
        description,
        language,
        stars: stars ? parseInt(stars) : 0,
        forks: forks ? parseInt(forks) : 0,
        issues: issues ? parseInt(issues) : 0,
        ownerAvatar,
        url,
      },
    });

    // Save the user's reference to the repository
    const savedRepo = await prisma.savedRepository.create({
      data: {
        userId: session.user.id,
        repositoryId: repository.id,
      },
      include: {
        repository: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Repository saved successfully",
      repository: {
        id: savedRepo.id,
        name: savedRepo.repository.name,
        owner: savedRepo.repository.owner,
        fullName: `${savedRepo.repository.owner}/${savedRepo.repository.name}`,
        description: savedRepo.repository.description,
        language: savedRepo.repository.language,
        stars: savedRepo.repository.stars,
        forks: savedRepo.repository.forks,
        issues: savedRepo.repository.issues,
        ownerAvatar: savedRepo.repository.ownerAvatar,
        url: savedRepo.repository.url,
        notes: savedRepo.notes,
        savedAt: savedRepo.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving repository:", error);
    return NextResponse.json(
      { error: "Failed to save repository" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a saved repository
export async function DELETE(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the repository ID from the request URL
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    // Find the repository to ensure it belongs to the current user
    const repo = await prisma.savedRepository.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the repository
    await prisma.savedRepository.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Repository removed successfully",
    });
  } catch (error) {
    console.error("Error removing repository:", error);
    return NextResponse.json(
      { error: "Failed to remove repository" },
      { status: 500 }
    );
  }
}
