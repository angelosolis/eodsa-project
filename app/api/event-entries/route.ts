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

export async function GET() {
  try {
    await ensureDbInitialized();
    // This would get all event entries - implement if needed for admin
    return NextResponse.json({ message: 'Event entries endpoint' });
  } catch (error) {
    console.error('Error fetching event entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'contestantId', 'eodsaId', 'region', 'performanceType', 
      'participantIds', 'ageCategory', 'calculatedFee', 'paymentMethod'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate participant IDs array
    if (!Array.isArray(body.participantIds) || body.participantIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

    // Validate performance type participant limits
    const participantCount = body.participantIds.length;
    const performanceType = body.performanceType;
    
    const limits = {
      'Solo': { min: 1, max: 1 },
      'Duet': { min: 2, max: 2 },
      'Trio': { min: 3, max: 3 },
      'Group': { min: 4, max: 30 }
    };
    
    const limit = limits[performanceType as keyof typeof limits];
    if (!limit) {
      return NextResponse.json(
        { error: 'Invalid performance type' },
        { status: 400 }
      );
    }
    
    if (participantCount < limit.min || participantCount > limit.max) {
      return NextResponse.json(
        { error: `${performanceType} requires ${limit.min === limit.max ? limit.min : `${limit.min}-${limit.max}`} participant(s)` },
        { status: 400 }
      );
    }

    // Create event entry
    const eventEntry = await db.createEventEntry({
      contestantId: body.contestantId,
      eodsaId: body.eodsaId,
      region: body.region,
      performanceType: body.performanceType,
      participantIds: body.participantIds,
      ageCategory: body.ageCategory,
      calculatedFee: body.calculatedFee,
      paymentStatus: body.paymentStatus || 'pending',
      paymentMethod: body.paymentMethod,
      approved: body.approved || false
    });

    return NextResponse.json(eventEntry, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event entry:', error);
    
    // Handle specific database errors
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        { error: 'Invalid contestant ID or participant IDs' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create event entry' },
      { status: 500 }
    );
  }
} 