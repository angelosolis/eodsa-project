import { NextResponse } from 'next/server';
import database from '@/lib/database';

export async function GET() {
  try {
    const events = await database.getAllEvents();
    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'name', 'description', 'region', 'ageCategory', 'performanceType',
      'eventDate', 'registrationDeadline', 'venue', 'entryFee', 'createdBy'
    ];
    
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate date fields
    const eventDate = new Date(body.eventDate);
    const registrationDeadline = new Date(body.registrationDeadline);
    
    if (registrationDeadline >= eventDate) {
      return NextResponse.json(
        { success: false, error: 'Registration deadline must be before event date' },
        { status: 400 }
      );
    }

    const event = await database.createEvent({
      name: body.name,
      description: body.description,
      region: body.region,
      ageCategory: body.ageCategory,
      performanceType: body.performanceType,
      eventDate: body.eventDate,
      registrationDeadline: body.registrationDeadline,
      venue: body.venue,
      status: body.status || 'upcoming',
      maxParticipants: body.maxParticipants,
      entryFee: body.entryFee,
      createdBy: body.createdBy
    });

    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
} 