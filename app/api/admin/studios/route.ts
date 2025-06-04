import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Get all studios for admin management
export async function GET() {
  try {
    await initializeDatabase();
    
    const studios = await unifiedDb.getAllStudios();

    return NextResponse.json({
      success: true,
      studios
    });
  } catch (error) {
    console.error('Error getting studios:', error);
    return NextResponse.json(
      { error: 'Failed to get studios' },
      { status: 500 }
    );
  }
}

// Approve or reject studio
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { studioId, action, adminId, rejectionReason } = await request.json();

    if (!studioId || !action || !adminId) {
      return NextResponse.json(
        { error: 'Studio ID, action, and admin ID are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a studio' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await unifiedDb.approveStudio(studioId, adminId);
    } else {
      await unifiedDb.rejectStudio(studioId, adminId, rejectionReason);
    }

    return NextResponse.json({
      success: true,
      message: `Studio ${action}d successfully`
    });
  } catch (error) {
    console.error('Error managing studio:', error);
    return NextResponse.json(
      { error: 'Failed to manage studio' },
      { status: 500 }
    );
  }
} 