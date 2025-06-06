import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  // Available studios endpoint is disabled - dancers cannot apply to studios
  return NextResponse.json(
    { error: 'Studio browsing is no longer available. Contact a studio head to be added to their studio.' },
    { status: 403 }
  );
} 