import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const dancerId = searchParams.get('dancerId');

    if (!dancerId) {
      return NextResponse.json(
        { error: 'Dancer ID is required' },
        { status: 400 }
      );
    }

    const studios = await unifiedDb.getAvailableStudios(dancerId);

    return NextResponse.json({
      success: true,
      studios
    });
  } catch (error) {
    console.error('Error getting available studios:', error);
    return NextResponse.json(
      { error: 'Failed to get available studios' },
      { status: 500 }
    );
  }
} 