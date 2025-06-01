import { NextResponse } from 'next/server';
import { getAllPerformances } from '@/lib/data';

export async function GET() {
  try {
    const performancesData = await getAllPerformances();
    
    // Map database fields to match dashboard interface
    const performances = performancesData.map(performance => ({
      id: performance.id,
      contestantId: performance.contestantId,
      title: performance.title,
      region: performance.region,
      performanceType: performance.performanceType,
      ageCategory: performance.ageCategory,
      category: performance.ageCategory, // Keep this for admin dashboard compatibility
      duration: performance.duration,
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