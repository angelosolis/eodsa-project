import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const assignments = await db.getAllJudgeAssignments();
    return NextResponse.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching judge assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['judgeId', 'eventId', 'assignedBy'];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if judge is already assigned to this event
    const existingAssignments = await db.getAllJudgeAssignments();
    const duplicate = existingAssignments.find(
      assignment => assignment.judgeId === body.judgeId && assignment.eventId === body.eventId
    );

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'Judge is already assigned to this event' },
        { status: 400 }
      );
    }

    const assignment = await db.createJudgeEventAssignment({
      judgeId: body.judgeId,
      eventId: body.eventId,
      assignedBy: body.assignedBy
    });

    return NextResponse.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error creating judge assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
} 