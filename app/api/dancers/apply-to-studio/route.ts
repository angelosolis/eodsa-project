import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  // Dancer applications are disabled - only studio heads can add dancers directly
  return NextResponse.json(
    { error: 'Dancer applications are no longer available. Contact a studio head to be added to their studio.' },
    { status: 403 }
  );
} 