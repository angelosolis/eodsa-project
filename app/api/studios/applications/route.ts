import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get studio applications or respond to applications
export async function GET(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    const status = searchParams.get('status');

    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }

    const applications = await unifiedDb.getStudioApplications(studioId, status || undefined);

    return NextResponse.json({
      success: true,
      applications: applications
    });
  } catch (error) {
    console.error('Get studio applications error:', error);
    return NextResponse.json(
      { error: 'Failed to get studio applications' },
      { status: 500 }
    );
  }
}

// Respond to studio application (accept/reject)
export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const body = await request.json();
    const { applicationId, action, respondedBy, rejectionReason } = body;

    if (!applicationId || !action || !respondedBy) {
      return NextResponse.json(
        { error: 'Application ID, action, and responder ID are required' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      await unifiedDb.respondToApplication(applicationId, 'accept', respondedBy);
      return NextResponse.json({
        success: true,
        message: 'Dancer application accepted. They are now part of your studio.'
      });
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }
      await unifiedDb.respondToApplication(applicationId, 'reject', respondedBy, rejectionReason);
      return NextResponse.json({
        success: true,
        message: 'Dancer application rejected'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "reject"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Respond to application error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to application' },
      { status: 500 }
    );
  }
} 