import { NextRequest, NextResponse } from "next/server";
import { studioDb, initializeDatabase } from "@/lib/database";
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { name, email, password, contactPerson, address, phone } = await request.json();

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

    // Create studio
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
      message: "Studio registered successfully. Awaiting admin approval.",
      studio: {
        id: studio.id,
        name: name,
        email: email,
        registrationNumber: studio.registrationNumber,
        approved: false, // New studios are not approved by default
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