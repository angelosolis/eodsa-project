import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';
import { emailService } from '@/lib/email';
import { verifyRecaptcha, checkRateLimit, getClientIP } from '@/lib/recaptcha';

// Individual dancer registration
export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const body = await request.json();
    console.log('Registration request body:', JSON.stringify(body, null, 2));
    
    const { name, dateOfBirth, nationalId, email, phone, guardianName, guardianEmail, guardianPhone, recaptchaToken } = body;
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit (3 registrations per IP per hour)
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      const resetTime = new Date(rateLimitCheck.resetTime!);
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can only register 3 accounts per hour. Try again after ${resetTime.toLocaleTimeString()}.`,
          rateLimited: true,
          resetTime: rateLimitCheck.resetTime
        },
        { status: 429 }
      );
    }
    
    // Verify reCAPTCHA token
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification is required' },
        { status: 400 }
      );
    }
    
    console.log('About to verify reCAPTCHA...');
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIP);
    console.log('reCAPTCHA result:', recaptchaResult);
    
    if (!recaptchaResult.success) {
      console.log('reCAPTCHA verification failed');
      return NextResponse.json(
        { 
          error: `Security verification failed: ${recaptchaResult.error}`,
          recaptchaFailed: true 
        },
        { status: 400 }
      );
    }
    
    console.log('reCAPTCHA verification passed!');

    console.log('Validation check:', { name, dateOfBirth, nationalId });
    
    if (!name || !dateOfBirth || !nationalId) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Name, date of birth, and national ID are required' },
        { status: 400 }
      );
    }

    // Calculate age
    const age = unifiedDb.calculateAge(dateOfBirth);
    console.log('Calculated age:', age);
    console.log('Guardian info:', { guardianName, guardianEmail, guardianPhone });
    
    // If under 18, require guardian information
    if (age < 18 && (!guardianName || !guardianEmail || !guardianPhone)) {
      console.log('Guardian validation failed for minor');
      return NextResponse.json(
        { error: 'Guardian information is required for dancers under 18' },
        { status: 400 }
      );
    }
    
    console.log('About to call registerDancer...');

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
    
    console.log('registerDancer result:', result);

    // Email system disabled for Phase 1
    // if (email) {
    //   try {
    //     await emailService.sendDancerRegistrationEmail(name, email, result.eodsaId);
    //     console.log('Registration email sent successfully to:', email);
    //   } catch (emailError) {
    //     console.error('Failed to send registration email:', emailError);
    //     // Don't fail the registration if email fails
    //   }
    // }

    return NextResponse.json({
      success: true,
      message: 'Dancer registered successfully. Your account is now active!',
      dancer: {
        id: result.id,
        eodsaId: result.eodsaId,
        name,
        age,
        approved: true // Show as immediately approved
      }
    });
  } catch (error: any) {
    console.error('Dancer registration error:', error);
    
    // Handle specific database errors with user-friendly messages
    if (error.message) {
      if (error.message.includes('already exists') || error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
        if (error.message.includes('national_id')) {
          return NextResponse.json(
            { error: 'A dancer with this National ID is already registered' },
            { status: 409 }
          );
        }
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'A dancer with this email address is already registered' },
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
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
} 