import { NextResponse } from 'next/server';
import { db } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { judgeId, performanceId, technique, artistry, presentation, overall, comments } = body;

    // Validate required fields
    if (!judgeId || !performanceId || !technique || !artistry || !presentation || !overall) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate score ranges
    if (technique < 1 || technique > 10 || 
        artistry < 1 || artistry > 10 || 
        presentation < 1 || presentation > 10 ||
        overall < 1 || overall > 10) {
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
        technicalScore: Number(technique),
        artisticScore: Number(artistry),
        overallScore: Number(overall),
        comments: comments || ''
      });
      
      score = {
        ...existingScore,
        technicalScore: Number(technique),
        artisticScore: Number(artistry),
        overallScore: Number(overall),
        comments: comments || ''
      };
      
      return NextResponse.json({ 
        success: true, 
        score,
        message: 'Score updated successfully'
      });
    } else {
      // Create new score
      score = await db.createScore({
        judgeId,
        performanceId,
        technicalScore: Number(technique),
        artisticScore: Number(artistry),
        overallScore: Number(overall),
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