import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Remove dancer from studio
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { studioId, dancerId } = await request.json();

    if (!studioId || !dancerId) {
      return NextResponse.json(
        { error: 'Studio ID and dancer ID are required' },
        { status: 400 }
      );
    }

    // Verify that the dancer belongs to this studio
    const studioDancers = await unifiedDb.getStudioDancers(studioId);
    const dancer = studioDancers.find(d => d.id === dancerId);
    
    if (!dancer) {
      return NextResponse.json(
        { error: 'Dancer not found in your studio' },
        { status: 404 }
      );
    }

    // Remove dancer from studio (set application status to withdrawn)
    await unifiedDb.removeDancerFromStudio(studioId, dancerId);

    return NextResponse.json({
      success: true,
      message: 'Dancer removed from studio successfully'
    });
  } catch (error: any) {
    console.error('Error removing dancer from studio:', error);
    
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to remove dancer from studio' },
      { status: 500 }
    );
  }
} 