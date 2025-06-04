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
  } catch (error) {
    console.error('Dancer registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register dancer' },
      { status: 500 }
    );
  }
} 