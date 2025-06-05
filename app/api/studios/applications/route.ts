import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get applications for a studio
export async function GET(request: NextRequest) {
  try {
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
      applications
    });
  } catch (error) {
    console.error('Error getting studio applications:', error);
    return NextResponse.json(
      { error: 'Failed to get applications' },
      { status: 500 }
    );
  }
}

// Respond to an application (accept/reject)
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { applicationId, action, respondedBy, rejectionReason } = await request.json();

    if (!applicationId || !action || !respondedBy) {
      return NextResponse.json(
        { error: 'Application ID, action, and responder ID are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting an application' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      await unifiedDb.respondToApplication(applicationId, 'accept', respondedBy);
    } else {
      await unifiedDb.respondToApplication(applicationId, 'reject', respondedBy, rejectionReason);
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action}ed successfully`
    });
  } catch (error: any) {
    console.error('Error responding to application:', error);
    
    // Handle specific database errors with user-friendly messages
    if (error.message) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('already processed') || error.message.includes('already responded')) {
        return NextResponse.json(
          { error: 'This application has already been processed' },
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
      { error: 'Failed to respond to application' },
      { status: 500 }
    );
  }
} 