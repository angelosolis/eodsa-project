import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { dancerId, studioId } = await request.json();

    if (!dancerId || !studioId) {
      return NextResponse.json(
        { error: 'Dancer ID and Studio ID are required' },
        { status: 400 }
      );
    }

    // Check if dancer is approved
    const dancers = await unifiedDb.getAllDancers();
    const dancer = dancers.find(d => d.id === dancerId);
    
    if (!dancer) {
      return NextResponse.json(
        { error: 'Dancer not found' },
        { status: 404 }
      );
    }

    if (!dancer.approved) {
      return NextResponse.json(
        { error: 'You must be approved by admin before applying to studios' },
        { status: 403 }
      );
    }

    // Submit application
    await unifiedDb.applyToStudio(dancerId, studioId);

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error: any) {
    console.error('Error applying to studio:', error);
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'You have already applied to this studio' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
} 