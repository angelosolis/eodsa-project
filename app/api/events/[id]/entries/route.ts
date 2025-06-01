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

    // Get all event entries for this event
    const allEntries = await db.getAllEventEntries();
    const eventEntries = allEntries.filter(entry => entry.eventId === eventId);
    
    // Enhance entries with contestant information
    const enhancedEntries = await Promise.all(
      eventEntries.map(async (entry) => {
        try {
          const contestant = await db.getContestantById(entry.contestantId);
          return {
            ...entry,
            contestantName: contestant?.name || 'Unknown',
            contestantEmail: contestant?.email || '',
            participantNames: entry.participantIds.map(id => {
              const dancer = contestant?.dancers.find(d => d.id === id);
              return dancer?.name || 'Unknown Dancer';
            })
          };
        } catch (error) {
          console.error(`Error loading contestant ${entry.contestantId}:`, error);
          return {
            ...entry,
            contestantName: 'Error loading',
            contestantEmail: '',
            participantNames: ['Error loading dancers']
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      entries: enhancedEntries
    });
  } catch (error) {
    console.error('Error fetching event entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch event entries' },
      { status: 500 }
    );
  }
} 