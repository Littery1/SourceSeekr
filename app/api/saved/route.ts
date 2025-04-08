// @/app/api/saved/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserSavedRepositories } from '@/lib/repository-service';
import { getServerSession } from "@auth/next";
import { authOptions } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    // Get user session for authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch the user's saved repositories
    const savedRepos = await getUserSavedRepositories(session.user.id);
    
    // Format the response
    const formattedRepos = savedRepos.map(saved => ({
      id: saved.repository.id,
      repoId: saved.repository.repoId,
      name: saved.repository.name,
      owner: saved.repository.owner,
      fullName: saved.repository.fullName,
      description: saved.repository.description,
      language: saved.repository.language,
      stars: saved.repository.stars,
      forks: saved.repository.forks,
      issues: saved.repository.issues,
      ownerAvatar: saved.repository.ownerAvatar,
      topics: saved.repository.topics,
      size: saved.repository.size,
      url: saved.repository.url,
      homepage: saved.repository.homepage,
      license: saved.repository.license,
      createdAt: saved.repository.createdAt,
      updatedAt: saved.repository.updatedAt,
      savedAt: saved.createdAt,
      notes: saved.notes
    }));
    
    return NextResponse.json({
      repositories: formattedRepos
    });
  } catch (error) {
    console.error('Error fetching saved repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved repositories' },
      { status: 500 }
    );
  }
}