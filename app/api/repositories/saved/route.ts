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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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
      userId: user.id,
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
      repoId: savedRepo.repository.repoId,
      name: savedRepo.repository.name,
      owner: savedRepo.repository.owner,
      fullName: `${savedRepo.repository.owner}/${savedRepo.repository.name}`,
      description: savedRepo.repository.description,
      language: savedRepo.repository.language,
      stars: savedRepo.repository.stars,
      forks: savedRepo.repository.forks,
      issues: savedRepo.repository.issues,
      ownerAvatar: savedRepo.repository.ownerAvatar,
      topics: savedRepo.repository.topics || [],
      size: savedRepo.repository.size || 0,
      url: savedRepo.repository.url,
      homepage: savedRepo.repository.homepage,
      license: savedRepo.repository.license,
      updatedAt: savedRepo.repository.updatedAt,
      createdAt: savedRepo.repository.createdAt,
      savedAt: savedRepo.createdAt,
      notes: savedRepo.notes,
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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const {
      repoId,
      owner,
      name,
      fullName,
      description,
      language,
      stars,
      forks,
      issues,
      ownerAvatar,
      topics,
      size,
      url,
      homepage,
      license,
      updatedAt,
      createdAt
    } = body;

    // Validate required fields
    if (!owner || !name || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert string values to numbers if needed
    const starsNum = typeof stars === 'string' ? parseInt(stars) : stars;
    const forksNum = typeof forks === 'string' ? parseInt(forks) : forks;
    const issuesNum = typeof issues === 'string' ? parseInt(issues) : issues;
    const sizeNum = typeof size === 'string' ? parseInt(size) : size;

    try {
      // Create or find the repository record first
      const repository = await prisma.repository.upsert({
        where: {
          repoId: repoId,
        },
        update: {
          fullName: fullName || `${owner}/${name}`,
          description,
          language,
          stars: starsNum || 0,
          forks: forksNum || 0,
          issues: issuesNum || 0,
          ownerAvatar,
          topics: topics || [],
          size: sizeNum || 0,
          url,
          homepage,
          license,
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        },
        create: {
          repoId: repoId,
          owner,
          name,
          fullName: fullName || `${owner}/${name}`,
          description,
          language,
          stars: starsNum || 0,
          forks: forksNum || 0,
          issues: issuesNum || 0,
          ownerAvatar,
          topics: topics || [],
          size: sizeNum || 0,
          url,
          homepage,
          license,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        },
      });

      // Check if repository is already saved
      const existingSavedRepo = await prisma.savedRepository.findFirst({
        where: {
          userId: user.id,
          repositoryId: repository.id,
        },
      });

      if (existingSavedRepo) {
        return NextResponse.json(
          {
            success: true,
            message: "Repository already saved",
            repository: {
              id: existingSavedRepo.id,
              name: repository.name,
              owner: repository.owner,
              fullName: repository.fullName,
              description: repository.description,
              language: repository.language,
              stars: repository.stars,
              forks: repository.forks,
              issues: repository.issues,
              ownerAvatar: repository.ownerAvatar,
              topics: repository.topics,
              size: repository.size,
              url: repository.url,
              homepage: repository.homepage,
              license: repository.license,
              updatedAt: repository.updatedAt,
              createdAt: repository.createdAt,
              notes: existingSavedRepo.notes,
              savedAt: existingSavedRepo.createdAt,
            },
          },
          { status: 200 }
        );
      }

      // Save the user's reference to the repository
      const savedRepo = await prisma.savedRepository.create({
        data: {
          userId: user.id,
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
          repoId: repository.repoId,
          name: repository.name,
          owner: repository.owner,
          fullName: repository.fullName,
          description: repository.description,
          language: repository.language,
          stars: repository.stars,
          forks: repository.forks,
          issues: repository.issues,
          ownerAvatar: repository.ownerAvatar,
          topics: repository.topics,
          size: repository.size,
          url: repository.url,
          homepage: repository.homepage,
          license: repository.license,
          updatedAt: repository.updatedAt,
          createdAt: repository.createdAt,
          notes: savedRepo.notes,
          savedAt: savedRepo.createdAt,
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database error when saving repository" },
        { status: 500 }
      );
    }
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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the repository fullName from the request URL
    const fullName = request.nextUrl.searchParams.get("fullName");

    if (!fullName) {
      return NextResponse.json(
        { error: "Repository fullName is required" },
        { status: 400 }
      );
    }

    // Find the repository to ensure it belongs to the current user
    const repo = await prisma.savedRepository.findFirst({
      where: {
        userId: user.id,
        repository: {
          fullName
        }
      },
      include: {
        repository: true
      }
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
        id: repo.id,
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