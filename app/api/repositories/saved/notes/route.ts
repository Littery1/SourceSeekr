import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/prisma/prisma';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // 'edge' is not supported by Prisma

export async function GET(req: NextRequest) {
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
    
    // Get the saved repository with notes
    const savedRepo = await prisma.savedRepository.findUnique({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId
        }
      },
      select: {
        notes: true
      }
    });
    
    if (!savedRepo) {
      return NextResponse.json(
        { error: 'Repository not found in saved list' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ notes: savedRepo.notes });
  } catch (error) {
    console.error('Error fetching repository notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repository notes' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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
    
    // Update the notes for the saved repository
    const updatedRepo = await prisma.savedRepository.update({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId
        }
      },
      data: {
        notes
      }
    });
    
    return NextResponse.json(updatedRepo);
  } catch (error) {
    console.error('Error updating repository notes:', error);
    return NextResponse.json(
      { error: 'Failed to update repository notes' },
      { status: 500 }
    );
  }
}