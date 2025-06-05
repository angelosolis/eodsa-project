import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { eodsaId, nationalId } = await request.json();

    if (!eodsaId || !nationalId) {
      return NextResponse.json(
        { error: 'EODSA ID and National ID are required' },
        { status: 400 }
      );
    }

    // Find dancer by EODSA ID
    const dancer = await unifiedDb.getDancerByEodsaId(eodsaId);
    
    if (!dancer) {
      return NextResponse.json(
        { error: 'Dancer not found' },
        { status: 404 }
      );
    }

    // Verify national ID matches
    if (dancer.nationalId !== nationalId) {
      return NextResponse.json(
        { error: 'Authentication failed - invalid credentials' },
        { status: 401 }
      );
    }

    // Return dancer session data
    return NextResponse.json({
      success: true,
      dancer: {
        id: dancer.id,
        eodsaId: dancer.eodsaId,
        name: dancer.name,
        email: dancer.email,
        approved: dancer.approved,
        age: dancer.age
      }
    });

  } catch (error: any) {
    console.error('Dancer authentication error:', error);
    
    // Handle specific authentication errors
    if (error.message) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Dancer not found with the provided EODSA ID' },
          { status: 404 }
        );
      }
      if (error.message.includes('invalid credentials') || error.message.includes('Authentication failed')) {
        return NextResponse.json(
          { error: 'Invalid EODSA ID or National ID combination' },
          { status: 401 }
        );
      }
      
      // For other specific errors, return the message
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 