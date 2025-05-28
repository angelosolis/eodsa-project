import { NextResponse } from 'next/server';
import { getScoresForPerformance } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ performanceId: string }> }
) {
  try {
    const { performanceId } = await params;

    if (!performanceId) {
      return NextResponse.json(
        { success: false, error: 'Performance ID is required' },
        { status: 400 }
      );
    }

    const scores = await getScoresForPerformance(performanceId);

    return NextResponse.json({
      success: true,
      scores
    });
  } catch (error) {
    console.error('Error fetching scores for performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
} 