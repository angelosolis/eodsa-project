import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get all accepted dancers for a studio in the new unified system
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

    const dancers = await unifiedDb.getStudioDancers(studioId);

    return NextResponse.json({
      success: true,
      dancers
    });
  } catch (error) {
    console.error('Error getting studio dancers:', error);
    return NextResponse.json(
      { error: 'Failed to get studio dancers' },
      { status: 500 }
    );
  }
} 