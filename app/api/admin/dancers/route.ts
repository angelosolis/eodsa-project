import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get all dancers with their approval status
export async function GET(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;

    const dancers = await unifiedDb.getAllDancers(status || undefined);

    return NextResponse.json({
      success: true,
      dancers: dancers
    });
  } catch (error) {
    console.error('Get dancers error:', error);
    return NextResponse.json(
      { error: 'Failed to get dancers' },
      { status: 500 }
    );
  }
}

// Approve or reject a dancer
export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const body = await request.json();
    const { dancerId, action, rejectionReason, adminId } = body;

    if (!dancerId || !action || !adminId) {
      return NextResponse.json(
        { error: 'Dancer ID, action, and admin ID are required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await unifiedDb.approveDancer(dancerId, adminId);
      return NextResponse.json({
        success: true,
        message: 'Dancer approved successfully. They can now apply to studios.'
      });
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }
      await unifiedDb.rejectDancer(dancerId, rejectionReason, adminId);
      return NextResponse.json({
        success: true,
        message: 'Dancer registration rejected'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Approve/reject dancer error:', error);
    return NextResponse.json(
      { error: 'Failed to process dancer approval' },
      { status: 500 }
    );
  }
} 