import { NextResponse } from 'next/server';
import { db } from '@/lib/data';
import { NextRequest } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Judge ID is required' },
        { status: 400 }
      );
    }

    const judge = await db.getJudgeById(id);

    if (!judge) {
      return NextResponse.json(
        { success: false, error: 'Judge not found' },
        { status: 404 }
      );
    }

    // Return judge data without password
    const { password: _, ...judgeData } = judge;

    return NextResponse.json({
      success: true,
      judge: judgeData
    });
  } catch (error) {
    console.error('Error fetching judge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch judge' },
      { status: 500 }
    );
  }
}

// Delete a judge by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();
    
    const { id } = await params;
    const judgeId = id;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const adminId = authHeader.replace('Bearer ', '');
    
    // Verify admin exists and is admin
    const admin = await db.getJudgeById(adminId);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get judge to check if it exists and is not admin
    const judge = await db.getJudgeById(judgeId);
    if (!judge) {
      return NextResponse.json(
        { error: 'Judge not found' },
        { status: 404 }
      );
    }

    if (judge.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete admin judges' },
        { status: 400 }
      );
    }

    // Delete the judge
    await db.deleteJudge(judgeId);

    return NextResponse.json({
      success: true,
      message: 'Judge deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete judge error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete judge' },
      { status: 500 }
    );
  }
} 