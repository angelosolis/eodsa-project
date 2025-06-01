import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = id;
    
    // First check if the event exists
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get all performances for this event
    const performances = await db.getPerformancesByEvent(eventId);

    return NextResponse.json({
      success: true,
      performances
    });
  } catch (error) {
    console.error('Error fetching event performances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch event performances' },
      { status: 500 }
    );
  }
} 