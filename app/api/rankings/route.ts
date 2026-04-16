import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/database';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    // // // await initializeDatabase() // Commented out for performance - initialization happens once on server start; // Commented out for performance - initialization happens once on server start // Commented out for performance - initialization happens once on server start
    dbInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Check for 'nationals' type
    const region = searchParams.get('region') || undefined;
    const ageCategory = searchParams.get('ageCategory') || undefined;
    const performanceType = searchParams.get('performanceType') || undefined;
    const eventIds = searchParams.get('eventIds');
    
    // If specific event IDs are requested, pass them to the calculation
    const selectedEventIds = eventIds ? eventIds.split(',') : undefined;
    
    console.log('📊 Rankings API called with params:', { type, region, ageCategory, performanceType, eventIds: selectedEventIds });
    
    // Use nationals rankings if type=nationals, otherwise use regional rankings
    let rankings;
    if (type === 'nationals') {
      rankings = await db.calculateNationalsRankings(selectedEventIds);
    } else {
      rankings = await db.calculateRankings(region, ageCategory, performanceType, selectedEventIds);
    }
    
    console.log('📊 Rankings API returning:', rankings.length, 'rankings');
    
    return NextResponse.json(rankings);
  } catch (error: any) {
    console.error('❌ Error fetching rankings:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch rankings', details: error.message },
      { status: 500 }
    );
  }
}

// New endpoint to get events with scores
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const { action } = await request.json();
    
    if (action === 'getEventsWithScores') {
      const eventsWithScores = await db.getEventsWithScores();
      return NextResponse.json({
        success: true,
        events: eventsWithScores
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in rankings POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 