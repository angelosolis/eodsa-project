import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, db, initializeDatabase } from '@/lib/database';

// Process accounts that have passed the 48-hour verification window
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID required' },
        { status: 400 }
      );
    }

    // Verify admin permissions using the correct db object
    const admin = await db.getJudgeById(adminId);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    // Get all dancers and studios
    const allDancers = await unifiedDb.getAllDancers();
    const allStudios = await unifiedDb.getAllStudios();
    
    // Find accounts older than 48 hours that are still pending (not approved, not rejected)
    const expiredDancers = allDancers.filter(dancer => 
      dancer.createdAt && 
      dancer.createdAt < fortyEightHoursAgo && 
      !dancer.approved && 
      !dancer.rejectionReason
    );
    
    const expiredStudios = allStudios.filter(studio => 
      studio.createdAt && 
      studio.createdAt < fortyEightHoursAgo && 
      !studio.approved && 
      !studio.rejectionReason
    );

    let processedCount = 0;

    // Auto-approve expired dancers (they passed the 48-hour spam check)
    for (const dancer of expiredDancers) {
      try {
        await unifiedDb.approveDancer(dancer.id, adminId);
        processedCount++;
      } catch (error) {
        console.error(`Failed to auto-approve dancer ${dancer.id}:`, error);
      }
    }

    // Auto-approve expired studios (they passed the 48-hour spam check)
    for (const studio of expiredStudios) {
      try {
        await unifiedDb.approveStudio(studio.id, adminId);
        processedCount++;
      } catch (error) {
        console.error(`Failed to auto-approve studio ${studio.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} accounts that passed the 48-hour verification window`,
      processed: {
        dancers: expiredDancers.length,
        studios: expiredStudios.length,
        total: processedCount
      }
    });

  } catch (error) {
    console.error('Process verification error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification window' },
      { status: 500 }
    );
  }
} 