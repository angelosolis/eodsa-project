import { NextRequest, NextResponse } from 'next/server';
import { getSql, db } from '@/lib/database';

type LogEntry = {
  id: string;
  at: string;
  category: string;
  action: string;
  summary: string;
  actor?: string | null;
  meta?: Record<string, unknown>;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '75', 10) || 75, 200);

    // Optional admin check — light SELECT, no schema migration
    const adminId = searchParams.get('adminId');
    if (adminId) {
      const admin = await db.getJudgeById(adminId);
      if (!admin || !admin.isAdmin) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
    }

    // No initializeDatabase() here — History must stay fast
    const sql = getSql();
    const perSource = Math.min(limit, 40);

    const [qualRows, scoreRows, eftRows, archiveRows] = await Promise.all([
      sql`
        SELECT id, event_id, dancer_id, action_type, action_details, performed_by, performed_at
        FROM qualification_audit_logs
        ORDER BY performed_at DESC
        LIMIT ${perSource}
      `.catch((e: unknown) => {
        console.warn('qualification_audit_logs unavailable', e);
        return [] as any[];
      }),
      sql`
        SELECT id, performance_id, judge_name, edited_by_name, edited_by, edited_at
        FROM score_edit_logs
        ORDER BY edited_at DESC
        LIMIT ${perSource}
      `.catch((e: unknown) => {
        console.warn('score_edit_logs unavailable', e);
        return [] as any[];
      }),
      sql`
        SELECT id, user_name, user_email, amount, invoice_number, submitted_at, verified_at
        FROM eft_payment_logs
        ORDER BY COALESCE(submitted_at, verified_at) DESC
        LIMIT ${perSource}
      `.catch((e: unknown) => {
        console.warn('eft_payment_logs unavailable', e);
        return [] as any[];
      }),
      sql`
        SELECT id, name, archived_at, archived_by, media_purged_at
        FROM events
        WHERE COALESCE(is_archived, false) = true OR media_purged_at IS NOT NULL
        ORDER BY COALESCE(archived_at, media_purged_at) DESC
        LIMIT ${perSource}
      `.catch((e: unknown) => {
        console.warn('events archive logs unavailable', e);
        return [] as any[];
      })
    ]);

    const logs: LogEntry[] = [];

    for (const row of qualRows as any[]) {
      logs.push({
        id: `qual-${row.id}`,
        at: row.performed_at ? new Date(row.performed_at).toISOString() : new Date().toISOString(),
        category: 'Qualification',
        action: row.action_type || 'action',
        summary: formatQualificationSummary(row),
        actor: row.performed_by || null,
        meta: { eventId: row.event_id, dancerId: row.dancer_id }
      });
    }

    for (const row of scoreRows as any[]) {
      logs.push({
        id: `score-${row.id}`,
        at: row.edited_at || new Date().toISOString(),
        category: 'Scores',
        action: 'score_edited',
        summary: `Score edited for performance ${row.performance_id}${row.judge_name ? ` (judge: ${row.judge_name})` : ''}`,
        actor: row.edited_by_name || row.edited_by || null,
        meta: { performanceId: row.performance_id }
      });
    }

    for (const row of eftRows as any[]) {
      logs.push({
        id: `eft-${row.id}`,
        at: row.submitted_at || row.verified_at || new Date().toISOString(),
        category: 'Payments',
        action: 'eft_logged',
        summary: `EFT payment logged${row.amount != null ? ` — R${row.amount}` : ''}${row.user_name ? ` · ${row.user_name}` : ''}${row.invoice_number ? ` · ${row.invoice_number}` : ''}`,
        actor: row.user_email || row.user_name || null
      });
    }

    for (const row of archiveRows as any[]) {
      if (row.archived_at) {
        logs.push({
          id: `archive-${row.id}`,
          at: row.archived_at,
          category: 'Events',
          action: 'event_archived',
          summary: `Event archived — ${row.name}`,
          actor: row.archived_by || null,
          meta: { eventId: row.id }
        });
      }
      if (row.media_purged_at) {
        logs.push({
          id: `purge-${row.id}`,
          at: row.media_purged_at,
          category: 'Events',
          action: 'media_purged',
          summary: `Event media purged from storage — ${row.name}`,
          actor: null,
          meta: { eventId: row.id }
        });
      }
    }

    logs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return NextResponse.json({
      success: true,
      logs: logs.slice(0, limit)
    });
  } catch (error: any) {
    console.error('Error loading activity logs:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load logs' },
      { status: 500 }
    );
  }
}

function formatQualificationSummary(row: any): string {
  const type = row.action_type || 'qualification action';
  const details = typeof row.action_details === 'string'
    ? (() => { try { return JSON.parse(row.action_details); } catch { return {}; } })()
    : (row.action_details || {});
  const extra = details?.reason || details?.message || details?.dancerName || '';
  return `${type.replace(/_/g, ' ')}${extra ? ` — ${extra}` : ''}${row.dancer_id ? ` · dancer ${row.dancer_id}` : ''}`;
}
