import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get all competition entries for a studio's dancers
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase(); // Temporarily enabled to run schema migrations - will disable after columns are added
    
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    const scopeParam = searchParams.get('scope');
    const scope = (scopeParam === 'current' || scopeParam === 'history' || scopeParam === 'all')
      ? scopeParam
      : 'all';

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }

    const entries = await unifiedDb.getStudioEntries(studioId, { scope });

    return NextResponse.json({
      success: true,
      entries,
      scope
    });
  } catch (error) {
    console.error('Error getting studio entries:', error);
    return NextResponse.json(
      { error: 'Failed to get studio entries' },
      { status: 500 }
    );
  }
} 