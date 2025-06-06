import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get all competition entries for a studio's dancers
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }

    const entries = await unifiedDb.getStudioEntries(studioId);

    return NextResponse.json({
      success: true,
      entries
    });
  } catch (error) {
    console.error('Error getting studio entries:', error);
    return NextResponse.json(
      { error: 'Failed to get studio entries' },
      { status: 500 }
    );
  }
} 