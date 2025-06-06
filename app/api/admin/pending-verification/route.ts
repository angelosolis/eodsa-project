import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get accounts created within the last 48 hours for verification
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const fortEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    // Get dancers created within 48 hours
    const dancers = await unifiedDb.getAllDancers();
    const recentDancers = dancers.filter(dancer => 
      dancer.createdAt && dancer.createdAt > fortEightHoursAgo
    );
    
    // Get studios created within 48 hours  
    const studios = await unifiedDb.getAllStudios();
    const recentStudios = studios.filter(studio => 
      studio.createdAt && studio.createdAt > fortEightHoursAgo
    );

    return NextResponse.json({
      success: true,
      data: {
        dancers: recentDancers,
        studios: recentStudios,
        timeWindow: '48 hours'
      }
    });
  } catch (error) {
    console.error('Get pending verification error:', error);
    return NextResponse.json(
      { error: 'Failed to get pending verification accounts' },
      { status: 500 }
    );
  }
} 