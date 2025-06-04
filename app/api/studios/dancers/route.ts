import { NextRequest, NextResponse } from 'next/server';
import { studioDb, initializeDatabase } from '@/lib/database';

// Get all dancers for a studio
export async function GET(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }

    const dancers = await studioDb.getStudioDancers(studioId);

    return NextResponse.json({
      success: true,
      dancers: dancers
    });
  } catch (error) {
    console.error('Get studio dancers error:', error);
    return NextResponse.json(
      { error: 'Failed to get studio dancers' },
      { status: 500 }
    );
  }
}

// Add a new dancer to the studio
export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const body = await request.json();
    const { studioId, dancer } = body;

    if (!studioId || !dancer) {
      return NextResponse.json(
        { error: 'Studio ID and dancer information are required' },
        { status: 400 }
      );
    }

    // Validate dancer fields
    if (!dancer.name || !dancer.age || !dancer.dateOfBirth || !dancer.nationalId) {
      return NextResponse.json(
        { error: 'Missing required dancer fields: name, age, dateOfBirth, nationalId' },
        { status: 400 }
      );
    }

    // Calculate age from date of birth to ensure consistency
    const birthDate = new Date(dancer.dateOfBirth);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    const result = await studioDb.addDancerToStudio(studioId, {
      name: dancer.name,
      age: calculatedAge,
      dateOfBirth: dancer.dateOfBirth,
      nationalId: dancer.nationalId
    });

    return NextResponse.json({
      success: true,
      message: 'Dancer added successfully',
      dancer: result
    });
  } catch (error) {
    console.error('Add dancer error:', error);
    return NextResponse.json(
      { error: 'Failed to add dancer' },
      { status: 500 }
    );
  }
}

// Update dancer information
export async function PUT(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const body = await request.json();
    const { dancerId, updates } = body;

    if (!dancerId) {
      return NextResponse.json(
        { error: 'Dancer ID is required' },
        { status: 400 }
      );
    }

    // If date of birth is being updated, recalculate age
    if (updates.dateOfBirth) {
      const birthDate = new Date(updates.dateOfBirth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      updates.age = calculatedAge;
    }

    await studioDb.updateDancer(dancerId, updates);

    return NextResponse.json({
      success: true,
      message: 'Dancer updated successfully'
    });
  } catch (error) {
    console.error('Update dancer error:', error);
    return NextResponse.json(
      { error: 'Failed to update dancer' },
      { status: 500 }
    );
  }
}

// Delete a dancer
export async function DELETE(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const dancerId = searchParams.get('dancerId');

    if (!dancerId) {
      return NextResponse.json(
        { error: 'Dancer ID is required' },
        { status: 400 }
      );
    }

    await studioDb.deleteDancer(dancerId);

    return NextResponse.json({
      success: true,
      message: 'Dancer deleted successfully'
    });
  } catch (error) {
    console.error('Delete dancer error:', error);
    return NextResponse.json(
      { error: 'Failed to delete dancer' },
      { status: 500 }
    );
  }
} 