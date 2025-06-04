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

// Apply to studio
export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const body = await request.json();
    const { dancerId, studioId } = body;

    if (!dancerId || !studioId) {
      return NextResponse.json(
        { error: 'Dancer ID and Studio ID are required' },
        { status: 400 }
      );
    }

    // Check if dancer is approved
    const dancers = await unifiedDb.getAllDancers('approved');
    const dancer = dancers.find(d => d.id === dancerId);
    
    if (!dancer) {
      return NextResponse.json(
        { error: 'Dancer not found or not approved. You must be approved by admin before applying to studios.' },
        { status: 403 }
      );
    }

    try {
      const result = await unifiedDb.applyToStudio(dancerId, studioId);
      return NextResponse.json({
        success: true,
        message: 'Application submitted successfully. The studio will review your application.',
        applicationId: result.id
      });
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed') || error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already applied to this studio' },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Apply to studio error:', error);
    return NextResponse.json(
      { error: 'Failed to apply to studio' },
      { status: 500 }
    );
  }
} 