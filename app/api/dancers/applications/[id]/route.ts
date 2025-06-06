import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Application withdrawal is disabled - only studio heads can manage dancer memberships
  return NextResponse.json(
    { error: 'Application withdrawal is no longer available. Contact the studio head if you need to leave a studio.' },
    { status: 403 }
  );
} 