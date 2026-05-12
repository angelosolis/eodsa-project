import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

/**
 * GET /api/events/[id]/safety-check
 * Check if event can be safely modified and what restrictions apply
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = id;
    const sqlClient = getSql();

    // Check if event exists
    const [event] = await sqlClient`
      SELECT id, name, participation_mode, status, event_date, registration_deadline
      FROM events 
      WHERE id = ${eventId}
    ` as any[];

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check for entries
    const [entryCount] = await sqlClient`
      SELECT COUNT(*) as count 
      FROM event_entries 
      WHERE event_id = ${eventId}
    ` as any[];

    const hasEntries = parseInt(entryCount.count) > 0;

    // Check for entries by type
    const entryTypes = await sqlClient`
      SELECT entry_type, COUNT(*) as count
      FROM event_entries
      WHERE event_id = ${eventId}
      GROUP BY entry_type
    ` as any[];

    const liveEntries = entryTypes.find((e: any) => e.entry_type === 'live')?.count || 0;
    const virtualEntries = entryTypes.find((e: any) => e.entry_type === 'virtual')?.count || 0;

    // Check for payments
    const [paymentCount] = await sqlClient`
      SELECT COUNT(*) as count 
      FROM event_entries 
      WHERE event_id = ${eventId} 
      AND payment_status = 'paid'
    ` as any[];

    const hasPayments = parseInt(paymentCount.count) > 0;

    // Check for scores
    const [scoreCount] = await sqlClient`
      SELECT COUNT(DISTINCT s.id) as count
      FROM scores s
      JOIN performances p ON p.id = s.performance_id
      WHERE p.event_id = ${eventId}
    ` as any[];

    const hasScores = parseInt(scoreCount.count) > 0;

    // Check for published scores
    const [publishedScoreCount] = await sqlClient`
      SELECT COUNT(DISTINCT s.id) as count
      FROM scores s
      JOIN performances p ON p.id = s.performance_id
      WHERE p.event_id = ${eventId} AND p.scores_published = true
    ` as any[];

    const hasPublishedScores = parseInt(publishedScoreCount.count) > 0;

    // Check for performances
    const [performanceCount] = await sqlClient`
      SELECT COUNT(*) as count 
      FROM performances 
      WHERE event_id = ${eventId}
    ` as any[];

    const hasPerformances = parseInt(performanceCount.count) > 0;

    // Check for judge assignments
    const judgeAssignments = await sqlClient`
      SELECT COUNT(DISTINCT judge_id) as count
      FROM judge_event_assignments
      WHERE event_id = ${eventId}
    ` as any[];

    const currentJudgeCount = parseInt(judgeAssignments[0]?.count) || 0;

    // Determine restrictions
    const restrictions = {
      canChangeJudgeCount: !hasScores, // Can't change if scores exist
      canChangeEventType: true, // Can change but with warnings
      canChangeFees: true, // Admins may edit; clients should still read warnings for paid events
      canChangeDates: event.status !== 'completed' && event.status !== 'in_progress',
      canChangeCertificateTemplate: true, // Always safe
      warnings: [] as string[],
      blocks: [] as string[]
    };

    // Add warnings
    if (hasScores && hasPublishedScores) {
      restrictions.warnings.push('⚠️ This event has published scores. Changing judge count could break score calculations.');
      restrictions.blocks.push('judgeCount');
    } else if (hasScores) {
      restrictions.warnings.push('⚠️ This event has scores. Changing judge count could break score calculations.');
      restrictions.blocks.push('judgeCount');
    }

    if (hasPayments) {
      restrictions.warnings.push('💰 This event has paid entries. Changing fees may not retroactively match amounts already paid — review totals carefully.');
    }

    if (liveEntries > 0 && event.participation_mode === 'virtual') {
      restrictions.warnings.push(`🎭 This event has ${liveEntries} live entry/entries. Changing to "Virtual only" would invalidate these entries.`);
    }

    if (virtualEntries > 0 && event.participation_mode === 'live') {
      restrictions.warnings.push(`🎥 This event has ${virtualEntries} virtual entry/entries. Changing to "Live only" would invalidate these entries.`);
    }

    if (hasPerformances && event.status === 'in_progress') {
      restrictions.warnings.push('⏳ Event is in progress. Some changes may affect active performances.');
    }

    if (event.status === 'completed') {
      restrictions.warnings.push('✅ Event is completed. Most changes are not recommended.');
      restrictions.blocks.push('dates', 'status');
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventName: event.name,
      currentJudgeCount,
      stats: {
        entries: parseInt(entryCount.count),
        liveEntries,
        virtualEntries,
        payments: parseInt(paymentCount.count),
        scores: parseInt(scoreCount.count),
        publishedScores: parseInt(publishedScoreCount.count),
        performances: parseInt(performanceCount.count)
      },
      restrictions,
      currentEventType: event.participation_mode
    });

  } catch (error) {
    console.error('Error checking event safety:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check event safety' },
      { status: 500 }
    );
  }
}

