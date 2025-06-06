import { NextRequest, NextResponse } from 'next/server';
import { db, studioDb, unifiedDb, initializeDatabase } from '@/lib/database';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { email, userType } = await request.json();

    if (!email || !userType) {
      return NextResponse.json(
        { error: 'Email and user type are required' },
        { status: 400 }
      );
    }

    if (!['judge', 'admin', 'studio'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    let user = null;
    let userName = '';

    // Find user based on type
    if (userType === 'judge' || userType === 'admin') {
      user = await db.getJudgeByEmail(email);
      userName = user?.name || '';
      
      // For admin, ensure they have admin privileges
      if (userType === 'admin' && user && !user.isAdmin) {
        return NextResponse.json(
          { error: 'Email not found' },
          { status: 404 }
        );
      }
    } else if (userType === 'studio') {
      user = await studioDb.getStudioByEmail(email);
      userName = user?.name || '';
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Create password reset token
    const resetTokenData = await unifiedDb.createPasswordResetToken(
      email, 
      userType as 'judge' | 'admin' | 'studio', 
      user.id
    );

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      email, 
      userName, 
      resetTokenData.token, 
      userType as 'judge' | 'admin' | 'studio'
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been sent to your email address'
    });

  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 