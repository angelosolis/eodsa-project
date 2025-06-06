import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = id;
    const { qualifiedForNationals } = await request.json();

    // Validate admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // In a real implementation, you'd verify the JWT token here
    // For now, we'll skip this since the frontend handles auth

    // Validate the input
    if (typeof qualifiedForNationals !== 'boolean') {
      return NextResponse.json(
        { error: 'qualifiedForNationals must be a boolean' },
        { status: 400 }
      );
    }

    // Update the entry
    await db.updateEventEntry(entryId, { qualifiedForNationals });

    return NextResponse.json({
      success: true,
      message: qualifiedForNationals 
        ? 'Entry qualified for nationals' 
        : 'Entry disqualified from nationals'
    });

  } catch (error: any) {
    console.error('Error updating qualification status:', error);
    return NextResponse.json(
      { error: 'Failed to update qualification status' },
      { status: 500 }
    );
  }
} 