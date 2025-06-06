import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/database';

// Initialize database on first request
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || undefined;
    const ageCategory = searchParams.get('ageCategory') || undefined;
    const performanceType = searchParams.get('performanceType') || undefined;
    const eventIds = searchParams.get('eventIds');
    
    // If specific event IDs are requested, pass them to the calculation
    const selectedEventIds = eventIds ? eventIds.split(',') : undefined;
    
    const rankings = await db.calculateRankings(region, ageCategory, performanceType, selectedEventIds);
    
    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
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