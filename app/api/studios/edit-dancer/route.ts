import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Update dancer information for a studio
export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { studioId, dancerId, name, dateOfBirth, nationalId, email, phone } = await request.json();

    if (!studioId || !dancerId) {
      return NextResponse.json(
        { error: 'Studio ID and dancer ID are required' },
        { status: 400 }
      );
    }

    if (!name || !dateOfBirth || !nationalId) {
      return NextResponse.json(
        { error: 'Name, date of birth, and national ID are required' },
        { status: 400 }
      );
    }

    // Verify that the dancer belongs to this studio
    const studioDancers = await unifiedDb.getStudioDancers(studioId);
    const dancer = studioDancers.find(d => d.id === dancerId);
    
    if (!dancer) {
      return NextResponse.json(
        { error: 'Dancer not found in your studio' },
        { status: 404 }
      );
    }

    // Calculate age from date of birth
    const age = unifiedDb.calculateAge(dateOfBirth);

    // Update dancer information
    await unifiedDb.updateDancer(dancerId, {
      name,
      dateOfBirth,
      nationalId,
      email: email || null,
      phone: phone || null,
      age
    });

    return NextResponse.json({
      success: true,
      message: 'Dancer updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating dancer:', error);
    
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update dancer' },
      { status: 500 }
    );
  }
} 