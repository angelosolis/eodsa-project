import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import { getAllContestants } from '@/lib/data';

export async function GET() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Test by getting contestants
    const contestants = await getAllContestants();
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully!',
      contestantsCount: contestants.length,
      contestants: contestants
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 