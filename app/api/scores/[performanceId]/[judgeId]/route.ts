import { NextResponse } from 'next/server';
import { db } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ performanceId: string; judgeId: string }> }
) {
  try {
    const { performanceId, judgeId } = await params;

    if (!performanceId || !judgeId) {
      return NextResponse.json(
        { success: false, error: 'Performance ID and Judge ID are required' },
        { status: 400 }
      );
    }

    // Check if this judge has already scored this performance
    const existingScore = await db.getScoreByJudgeAndPerformance(judgeId, performanceId);

    if (existingScore) {
      return NextResponse.json({
        success: true,
        score: existingScore,
        message: 'Score found'
      });
    } else {
      return NextResponse.json({
        success: false,
        score: null,
        message: 'No score found for this judge and performance'
      });
    }
  } catch (error) {
    console.error('Error checking score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check score' },
      { status: 500 }
    );
  }
} 