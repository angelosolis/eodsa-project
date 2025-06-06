import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get dancer's applications
export async function GET(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const dancerId = searchParams.get('dancerId');

    if (!dancerId) {
      return NextResponse.json(
        { error: 'Dancer ID is required' },
        { status: 400 }
      );
    }

    const applications = await unifiedDb.getDancerApplications(dancerId);

    return NextResponse.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error getting dancer applications:', error);
    return NextResponse.json(
      { error: 'Failed to get applications' },
      { status: 500 }
    );
  }
}

// Apply to studio - DISABLED
export async function POST(request: NextRequest) {
  // Dancer applications are disabled - only studio heads can add dancers directly
  return NextResponse.json(
    { error: 'Dancer applications are no longer available. Contact a studio head to be added to their studio.' },
    { status: 403 }
  );
} 