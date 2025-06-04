import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const result = await emailService.testConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMTP connection successful! Email system is ready.',
        connectionDetails: {
          host: 'mail.upstreamcreatives.co.za',
          port: 587,
          secure: false,
          from: 'devops@upstreamcreatives.co.za'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test email connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Send a test email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name = 'Test User' } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email address is required'
      }, { status: 400 });
    }

    // Send a test registration email
    const result = await emailService.sendDancerRegistrationEmail(
      name,
      email,
      'E999999' // Test EODSA ID
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Send test email error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 