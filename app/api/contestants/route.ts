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
    const contestants = await db.getAllContestants();
    return NextResponse.json(contestants);
  } catch (error) {
    console.error('Error fetching contestants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contestants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, type' },
        { status: 400 }
      );
    }

    // Validate dancers array
    if (!body.dancers || !Array.isArray(body.dancers) || body.dancers.length === 0) {
      return NextResponse.json(
        { error: 'At least one dancer is required' },
        { status: 400 }
      );
    }

    // Validate each dancer
    for (const dancer of body.dancers) {
      if (!dancer.name || !dancer.age || !dancer.style || !dancer.nationalId) {
        return NextResponse.json(
          { error: 'Each dancer must have name, age, style, and nationalId' },
          { status: 400 }
        );
      }
    }

    // Validate studio fields if studio type
    if (body.type === 'studio') {
      if (!body.studioName || !body.studioInfo?.address || !body.studioInfo?.contactPerson) {
        return NextResponse.json(
          { error: 'Studio registration requires studioName, address, and contactPerson' },
          { status: 400 }
        );
      }
    }

    // Create contestant
    const contestant = await db.createContestant({
      name: body.name,
      email: body.email,
      phone: body.phone,
      type: body.type,
      studioName: body.studioName,
      studioInfo: body.studioInfo,
      dancers: body.dancers
    });

    return NextResponse.json(contestant, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contestant:', error);
    
    // Handle unique constraint violations
    if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('duplicate key')) {
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'Email address is already registered' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create contestant' },
      { status: 500 }
    );
  }
} 