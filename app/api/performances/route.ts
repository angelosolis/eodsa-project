import { NextResponse } from 'next/server';
import { getAllPerformances } from '@/lib/data';

export async function GET() {
  try {
    const performances = await getAllPerformances();
    return NextResponse.json({ success: true, performances });
  } catch (error) {
    console.error('Error fetching performances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performances' },
      { status: 500 }
    );
  }
} 