import { NextResponse } from 'next/server';
import { getAllJudges } from '@/lib/data';

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

    const judges = await getAllJudges();
    const judge = judges.find(j => j.id === id);

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