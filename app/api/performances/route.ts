import { NextResponse } from 'next/server';
import { db } from '@/lib/data';

export async function GET() {
  try {
    const performancesData = await db.getAllPerformances();
    
    // Map database fields to match dashboard interface
    const performances = performancesData.map(performance => ({
      id: performance.id,
      eventId: performance.eventId,
      contestantId: performance.contestantId,
      title: performance.title,
      duration: performance.duration,
      participantNames: performance.participantNames,
      choreographer: performance.choreographer,
      mastery: performance.mastery,
      itemStyle: performance.itemStyle,
      status: performance.status,
      contestantName: performance.contestantName
    }));
    
    return NextResponse.json({ success: true, performances });
  } catch (error) {
    console.error('Error fetching performances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performances' },
      { status: 500 }
    );
  }
} 