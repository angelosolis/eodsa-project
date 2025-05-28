import { NextResponse } from 'next/server';
import { db } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: { performanceId: string; judgeId: string } }
) {
  try {
    const { performanceId, judgeId } = await params;

    if (!performanceId || !judgeId) {
      return NextResponse.json(
        { success: false, error: 'Performance ID and Judge ID are required' },
        { status: 400 }
      );
    }

    const score = await db.getScoreByJudgeAndPerformance(judgeId, performanceId);

    return NextResponse.json({
      success: true,
      score: score || null
    });
  } catch (error) {
    console.error('Error fetching score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch score' },
      { status: 500 }
    );
  }
} 