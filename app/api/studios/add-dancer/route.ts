import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Add a registered dancer directly to a studio by EODSA ID
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { studioId, eodsaId, addedBy } = await request.json();

    if (!studioId || !eodsaId || !addedBy) {
      return NextResponse.json(
        { error: 'Studio ID, EODSA ID, and added by are required' },
        { status: 400 }
      );
    }

    // Validate EODSA ID format (should be like "E123456")
    const eodsaIdRegex = /^E\d{6}$/;
    if (!eodsaIdRegex.test(eodsaId)) {
      return NextResponse.json(
        { error: 'Invalid EODSA ID format. Should be E followed by 6 digits (e.g., E123456)' },
        { status: 400 }
      );
    }

    const result = await unifiedDb.addDancerToStudioByEodsaId(studioId, eodsaId, addedBy);

    return NextResponse.json({
      success: true,
      message: 'Dancer added to studio successfully',
      application: result
    });
  } catch (error: any) {
    console.error('Error adding dancer to studio:', error);
    
    // Handle specific error messages
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add dancer to studio' },
      { status: 500 }
    );
  }
} 