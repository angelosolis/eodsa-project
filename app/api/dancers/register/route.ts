import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';
import { emailService } from '@/lib/email';

// Individual dancer registration
export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const body = await request.json();
    const { name, dateOfBirth, nationalId, email, phone, guardianName, guardianEmail, guardianPhone } = body;

    if (!name || !dateOfBirth || !nationalId) {
      return NextResponse.json(
        { error: 'Name, date of birth, and national ID are required' },
        { status: 400 }
      );
    }

    // Calculate age
    const age = unifiedDb.calculateAge(dateOfBirth);
    
    // If under 18, require guardian information
    if (age < 18 && (!guardianName || !guardianEmail || !guardianPhone)) {
      return NextResponse.json(
        { error: 'Guardian information is required for dancers under 18' },
        { status: 400 }
      );
    }

    const result = await unifiedDb.registerDancer({
      name,
      dateOfBirth,
      nationalId,
      email,
      phone,
      guardianName,
      guardianEmail,
      guardianPhone
    });

    // Send registration confirmation email if email is provided
    if (email) {
      try {
        await emailService.sendDancerRegistrationEmail(name, email, result.eodsaId);
        console.log('Registration email sent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
        // Don't fail the registration if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dancer registered successfully. Awaiting admin approval.',
      dancer: {
        id: result.id,
        eodsaId: result.eodsaId,
        name,
        age,
        approved: false
      }
    });
  } catch (error: any) {
    console.error('Dancer registration error:', error);
    
    // Handle specific database errors with user-friendly messages
    if (error.message) {
      if (error.message.includes('already registered') || error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'A dancer with this email address is already registered' },
            { status: 409 }
          );
        }
        if (error.message.includes('national') || error.message.includes('nationalId')) {
          return NextResponse.json(
            { error: 'A dancer with this National ID is already registered' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'This dancer is already registered' },
          { status: 409 }
        );
      }
      
      // Return the specific error message from the database layer
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to register dancer' },
      { status: 500 }
    );
  }
} 