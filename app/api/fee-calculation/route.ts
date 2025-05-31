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
    const ageCategory = searchParams.get('ageCategory');
    const performanceType = searchParams.get('performanceType');
    
    if (!ageCategory || !performanceType) {
      return NextResponse.json(
        { error: 'Both ageCategory and performanceType are required' },
        { status: 400 }
      );
    }

    const fee = await db.calculateFee(ageCategory, performanceType);
    
    return NextResponse.json({ fee });
  } catch (error) {
    console.error('Error calculating fee:', error);
    return NextResponse.json(
      { error: 'Failed to calculate fee' },
      { status: 500 }
    );
  }
} 