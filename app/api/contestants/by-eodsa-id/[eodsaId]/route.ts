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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eodsaId: string }> }
) {
  try {
    await ensureDbInitialized();
    const { eodsaId } = await params;
    
    if (!eodsaId) {
      return NextResponse.json(
        { error: 'E-O-D-S-A ID is required' },
        { status: 400 }
      );
    }

    // Find contestant by E-O-D-S-A ID
    const contestants = await db.getAllContestants();
    const contestant = contestants.find(c => c.eodsaId === eodsaId);
    
    if (!contestant) {
      return NextResponse.json(
        { error: 'Contestant not found with this E-O-D-S-A ID' },
        { status: 404 }
      );
    }

    // Get full contestant details including dancers
    const fullContestant = await db.getContestantById(contestant.id);
    
    if (!fullContestant) {
      return NextResponse.json(
        { error: 'Contestant details not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(fullContestant);
  } catch (error) {
    console.error('Error fetching contestant by E-O-D-S-A ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contestant' },
      { status: 500 }
    );
  }
} 