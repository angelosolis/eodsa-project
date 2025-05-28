import { NextResponse } from 'next/server';
import { getAllContestants } from '@/lib/data';

export async function GET() {
  try {
    const contestants = await getAllContestants();
    return NextResponse.json({ success: true, contestants });
  } catch (error) {
    console.error('Error fetching contestants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contestants' },
      { status: 500 }
    );
  }
} 