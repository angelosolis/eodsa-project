import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = id;
    const { itemNumber } = await request.json();

    // Validate admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Validate the input
    if (typeof itemNumber !== 'number' || itemNumber < 1) {
      return NextResponse.json(
        { error: 'itemNumber must be a positive integer' },
        { status: 400 }
      );
    }

    // Check if item number is already assigned to another entry
    const allEntries = await db.getAllEventEntries();
    const existingEntry = allEntries.find(entry => 
      entry.itemNumber === itemNumber && entry.id !== entryId
    );

    if (existingEntry) {
      return NextResponse.json(
        { error: `Item number ${itemNumber} is already assigned to another entry` },
        { status: 409 }
      );
    }

    // Update the entry with the item number
    await db.updateEventEntry(entryId, { itemNumber });

    return NextResponse.json({
      success: true,
      message: `Item number ${itemNumber} assigned successfully`
    });

  } catch (error: any) {
    console.error('Error assigning item number:', error);
    return NextResponse.json(
      { error: 'Failed to assign item number' },
      { status: 500 }
    );
  }
} 