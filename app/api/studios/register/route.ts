import { NextRequest, NextResponse } from "next/server";
import { studioDb, initializeDatabase } from "@/lib/database";
import bcrypt from 'bcryptjs';
import { verifyRecaptcha, checkRateLimit, getClientIP } from '@/lib/recaptcha';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { name, email, password, contactPerson, address, phone, recaptchaToken } = await request.json();
    
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
    
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIP);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { 
          error: `Security verification failed: ${recaptchaResult.error}`,
          recaptchaFailed: true 
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !email || !password || !contactPerson) {
      return NextResponse.json(
        { error: "Name, email, password, and contact person are required" },
        { status: 400 }
      );
    }

    // Check if studio already exists
    const existingStudio = await studioDb.getStudioByEmail(email);
    if (existingStudio) {
      return NextResponse.json(
        { error: "A studio with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create studio - now auto-approved
    const studio = await studioDb.createStudio({
      name,
      email,
      password: hashedPassword,
      contactPerson,
      address: address || '',
      phone: phone || ''
    });

    return NextResponse.json({
      success: true,
      message: "Studio registered successfully. Your account is now active!",
      studio: {
        id: studio.id,
        name: name,
        email: email,
        registrationNumber: studio.registrationNumber,
        approved: true, // Show as immediately approved
        contactPerson: contactPerson,
        address: address || '',
        phone: phone || ''
      }
    });

  } catch (error) {
    console.error("Studio registration error:", error);
    return NextResponse.json(
      { error: "Failed to register studio" },
      { status: 500 }
    );
  }
} 