import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find judge by email using database
    const judge = await db.getJudgeByEmail(email);
    if (!judge) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, judge.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return judge session data (without password)
    const judgeSession = {
      id: judge.id,
      name: judge.name,
      email: judge.email,
      isAdmin: judge.isAdmin
    };

    return NextResponse.json({
      success: true,
      judge: judgeSession
    });
  } catch (error: any) {
    console.error('Authentication error:', error);
    
    // Handle specific authentication errors
    if (error.message) {
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      
      // For other specific errors, return the message
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 