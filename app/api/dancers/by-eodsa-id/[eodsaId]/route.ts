import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eodsaId: string }> }
) {
  try {
    await initializeDatabase();
    
    const { eodsaId } = await params;

    if (!eodsaId) {
      return NextResponse.json(
        { error: 'EODSA ID is required' },
        { status: 400 }
      );
    }

    // Get dancer by EODSA ID
    const dancer = await unifiedDb.getDancerByEodsaId(eodsaId);

    if (!dancer) {
      return NextResponse.json(
        { error: 'Dancer not found with this EODSA ID' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dancer
    });
  } catch (error) {
    console.error('Error getting dancer by EODSA ID:', error);
    return NextResponse.json(
      { error: 'Failed to get dancer data' },
      { status: 500 }
    );
  }
} 