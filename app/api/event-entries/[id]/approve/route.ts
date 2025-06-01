import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = id;
    
    // Get the current entry
    const allEntries = await db.getAllEventEntries();
    const entry = allEntries.find(e => e.id === entryId);
    
    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Event entry not found' },
        { status: 404 }
      );
    }

    // Update the entry to approved
    const updatedEntry = {
      ...entry,
      approved: true,
      approvedAt: new Date().toISOString()
    };

    await db.updateEventEntry(entryId, updatedEntry);

    return NextResponse.json({
      success: true,
      message: 'Event entry approved successfully'
    });
  } catch (error) {
    console.error('Error approving event entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve event entry' },
      { status: 500 }
    );
  }
} 