import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const judgeId = id;
    
    // Get assignments for this judge
    const assignments = await db.getJudgeAssignments(judgeId);

    return NextResponse.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching judge assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch judge assignments' },
      { status: 500 }
    );
  }
} 