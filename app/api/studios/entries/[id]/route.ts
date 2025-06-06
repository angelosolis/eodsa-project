import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';
import { MASTERY_LEVELS, ITEM_STYLES } from '@/lib/types';

// Update a specific competition entry for a studio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { studioId, ...updates } = body;

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }

    // Validate updates
    if (updates.mastery && !MASTERY_LEVELS.includes(updates.mastery)) {
      return NextResponse.json(
        { error: 'Invalid mastery level' },
        { status: 400 }
      );
    }

    if (updates.itemStyle && !ITEM_STYLES.includes(updates.itemStyle)) {
      return NextResponse.json(
        { error: 'Invalid item style' },
        { status: 400 }
      );
    }

    if (updates.estimatedDuration && (updates.estimatedDuration < 1 || updates.estimatedDuration > 10)) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 10 minutes' },
        { status: 400 }
      );
    }

    const updatedEntry = await unifiedDb.updateStudioEntry(studioId, id, updates);

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
      message: 'Entry updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating studio entry:', error);
    
    if (error.message.includes('not found') || error.message.includes('not owned')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('deadline')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// Delete/withdraw a specific competition entry for a studio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { studioId } = body;

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }

    const result = await unifiedDb.deleteStudioEntry(studioId, id);

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error deleting studio entry:', error);
    
    if (error.message.includes('not found') || error.message.includes('not owned')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('deadline')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
} 