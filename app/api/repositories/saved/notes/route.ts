import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH handler to update notes for a saved repository
export async function PATCH(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { id, notes } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 });
    }
    
    // Find the repository to ensure it belongs to the current user
    const repo = await prisma.savedRepository.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!repo) {
      return NextResponse.json({ error: 'Repository not found or access denied' }, { status: 404 });
    }
    
    // Update the notes
    const updatedRepo = await prisma.savedRepository.update({
      where: {
        id,
      },
      data: {
        notes,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notes updated successfully', 
      repository: updatedRepo 
    });
  } catch (error) {
    console.error('Error updating repository notes:', error);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}