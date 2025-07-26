import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/prisma/prisma';

export const runtime = 'nodejs'; // 'edge' is not supported by Prisma

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const savedRepos = await prisma.savedRepository.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        repository: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(savedRepos);
  } catch (error) {
    console.error('Error fetching saved repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved repositories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { repositoryId, notes } = await req.json();
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!repositoryId) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }
    
    // Check if already saved
    const existing = await prisma.savedRepository.findUnique({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId
        }
      }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Repository already saved' },
        { status: 400 }
      );
    }
    
    // Save the repository
    const savedRepo = await prisma.savedRepository.create({
      data: {
        userId: session.user.id,
        repositoryId,
        notes
      }
    });
    
    return NextResponse.json(savedRepo);
  } catch (error) {
    console.error('Error saving repository:', error);
    return NextResponse.json(
      { error: 'Failed to save repository' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repositoryId = searchParams.get('repositoryId');
    
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!repositoryId) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the saved repository
    await prisma.savedRepository.delete({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved repository:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved repository' },
      { status: 500 }
    );
  }
}