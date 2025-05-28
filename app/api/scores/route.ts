import { NextResponse } from 'next/server';
import { addScore, db } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { judgeId, performanceId, technicalScore, artisticScore, overallScore, comments } = body;

    // Validate required fields
    if (!judgeId || !performanceId || !technicalScore || !artisticScore || !overallScore) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate score ranges
    if (technicalScore < 1 || technicalScore > 10 || 
        artisticScore < 1 || artisticScore > 10 || 
        overallScore < 1 || overallScore > 10) {
      return NextResponse.json(
        { success: false, error: 'Scores must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Check if this judge has already scored this performance
    const existingScore = await db.getScoreByJudgeAndPerformance(judgeId, performanceId);

    let score;
    if (existingScore) {
      // Update existing score
      await db.updateScore(existingScore.id, {
        technicalScore: Number(technicalScore),
        artisticScore: Number(artisticScore),
        overallScore: Number(overallScore),
        comments: comments || ''
      });
      
      score = {
        ...existingScore,
        technicalScore: Number(technicalScore),
        artisticScore: Number(artisticScore),
        overallScore: Number(overallScore),
        comments: comments || ''
      };
      
      return NextResponse.json({ 
        success: true, 
        score,
        message: 'Score updated successfully'
      });
    } else {
      // Create new score
      score = await addScore({
        judgeId,
        performanceId,
        technicalScore: Number(technicalScore),
        artisticScore: Number(artisticScore),
        overallScore: Number(overallScore),
        comments: comments || ''
      });
      
      return NextResponse.json({ 
        success: true, 
        score,
        message: 'Score submitted successfully'
      });
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
} 