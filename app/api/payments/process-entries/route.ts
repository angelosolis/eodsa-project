// Process Entries After Payment API
// POST /api/payments/process-entries
// Creates entries after successful payment verification (reconciles missing lines)

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import {
  reconcileBatchEntriesFromPending,
  parsePendingEntriesData,
  type PendingBatchEntry,
} from '@/lib/batch-entry-creation';

const sql = neon(process.env.DATABASE_URL!);

interface EntryData extends PendingBatchEntry {
  performanceType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { payment_id, entries }: { payment_id: string; entries: EntryData[] } = await request.json();

    if (!payment_id || !entries || !Array.isArray(entries)) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID and entries array are required',
      }, { status: 400 });
    }

    const [payment] = await sql`
      SELECT payment_id, pending_entries_data, status
      FROM payments
      WHERE payment_id = ${payment_id} AND status = 'completed'
    `;

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found or not completed',
      }, { status: 404 });
    }

    // Prefer payment snapshot (source of truth); fall back to client session payload
    let entriesToProcess: PendingBatchEntry[] = entries;
    if (payment.pending_entries_data) {
      const fromDb = parsePendingEntriesData(payment.pending_entries_data);
      if (fromDb.length > 0) {
        entriesToProcess = fromDb;
      }
    }

    const reconcileResult = await reconcileBatchEntriesFromPending(
      payment_id,
      entriesToProcess,
      'process_entries'
    );

    await sql`
      INSERT INTO payment_logs (payment_id, event_type, event_data, ip_address, user_agent)
      VALUES (
        ${payment_id}, 'entries_created',
        ${JSON.stringify({
          created_count: reconcileResult.created.length,
          skipped_count: reconcileResult.skipped.length,
          error_count: reconcileResult.errors.length,
          entries: reconcileResult.created,
          errors: reconcileResult.errors.length > 0 ? reconcileResult.errors : undefined,
          source: 'process_entries_api',
        })},
        ${request.headers.get('x-forwarded-for') || 'unknown'},
        ${request.headers.get('user-agent') || 'unknown'}
      )
    `;

    const totalInDb = await sql`
      SELECT COUNT(*)::int AS c FROM event_entries WHERE payment_id = ${payment_id}
    ` as Array<{ c: number }>;

    if (reconcileResult.created.length === 0 && reconcileResult.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create any entries',
        errors: reconcileResult.errors,
        skipped: reconcileResult.skipped,
        totalInDatabase: totalInDb[0]?.c ?? 0,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message:
        reconcileResult.created.length > 0
          ? `Created ${reconcileResult.created.length} entries`
          : 'All entries already exist for this payment',
      entries: reconcileResult.created,
      skipped: reconcileResult.skipped,
      errors: reconcileResult.errors,
      totalInDatabase: totalInDb[0]?.c ?? 0,
      expectedCount: entriesToProcess.length,
      payment_id,
    });
  } catch (error) {
    console.error('💥 Process entries error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID is required',
      }, { status: 400 });
    }

    const [payment] = await sql`
      SELECT pending_entries_data FROM payments WHERE payment_id = ${paymentId}
    `;

    const pendingCount = payment?.pending_entries_data
      ? parsePendingEntriesData(payment.pending_entries_data).length
      : 0;

    const entries = await sql`
      SELECT
        ee.id,
        ee.item_name,
        ee.calculated_fee,
        ee.payment_status,
        ee.created_at,
        e.name as event_name
      FROM event_entries ee
      JOIN events e ON ee.event_id = e.id
      WHERE ee.payment_id = ${paymentId}
      ORDER BY ee.created_at
    `;

    return NextResponse.json({
      success: true,
      entries: entries.map((e) => ({
        id: e.id,
        itemName: e.item_name,
        fee: parseFloat(e.calculated_fee),
        paymentStatus: e.payment_status,
        eventName: e.event_name,
        createdAt: e.created_at,
      })),
      count: entries.length,
      expectedCount: pendingCount,
      isComplete: pendingCount > 0 ? entries.length >= pendingCount : entries.length > 0,
    });
  } catch (error) {
    console.error('💥 Check entries error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
