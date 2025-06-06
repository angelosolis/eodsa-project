import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb, initializeDatabase } from '@/lib/database';

// Reject (disable) spam accounts
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { accountId, accountType, reason, adminId } = body;

    if (!accountId || !accountType || !adminId) {
      return NextResponse.json(
        { error: 'Account ID, type, and admin ID are required' },
        { status: 400 }
      );
    }

    if (!['dancer', 'studio'].includes(accountType)) {
      return NextResponse.json(
        { error: 'Account type must be "dancer" or "studio"' },
        { status: 400 }
      );
    }

    if (accountType === 'dancer') {
      await unifiedDb.rejectDancer(accountId, reason || 'Flagged as spam account', adminId);
    } else {
      await unifiedDb.rejectStudio(accountId, adminId, reason || 'Flagged as spam account');
    }

    return NextResponse.json({
      success: true,
      message: `${accountType} account rejected successfully`
    });
  } catch (error) {
    console.error('Reject account error:', error);
    return NextResponse.json(
      { error: 'Failed to reject account' },
      { status: 500 }
    );
  }
} 