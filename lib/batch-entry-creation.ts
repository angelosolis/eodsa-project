/**
 * Create / reconcile event entries from PayFast batch pending_entries_data.
 * Idempotent: skips items already saved for the same payment (by item name + participants).
 */

import { getSql } from './database';
import { autoMarkRegistrationForParticipants } from './registration-fee-tracker';
import type { Performance } from './types';

export interface PendingBatchEntry {
  eventId: string;
  contestantId: string;
  eodsaId: string;
  participantIds: string[];
  calculatedFee: number;
  itemName: string;
  choreographer: string;
  mastery: string;
  itemStyle: string;
  estimatedDuration: number;
  entryType?: 'live' | 'virtual';
  musicFileUrl?: string | null;
  musicFileName?: string | null;
  videoExternalUrl?: string | null;
  videoExternalType?: string | null;
  performanceType?: string;
}

export interface BatchEntryCreationResult {
  created: Array<{ entryId: string; itemName: string; performanceType?: string; fee: number }>;
  skipped: Array<{ itemName: string; reason: string; existingEntryId?: string }>;
  errors: Array<{ itemName: string; index: number; error: string }>;
}

function normalizeItemName(name: string): string {
  return (name || '').trim().toLowerCase();
}

function parseParticipantIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Stable key to match pending cart line ↔ saved row for the same payment. */
export function batchEntryFingerprint(itemName: string, participantIds: string[]): string {
  const ids = [...participantIds].map(String).filter(Boolean).sort();
  return `${normalizeItemName(itemName)}|${ids.join(',')}`;
}

async function loadExistingFingerprintsForPayment(paymentId: string): Promise<Map<string, string>> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, item_name, participant_ids
    FROM event_entries
    WHERE payment_id = ${paymentId}
  ` as Array<{ id: string; item_name: string; participant_ids: unknown }>;

  const map = new Map<string, string>();
  for (const row of rows) {
    const ids = parseParticipantIds(row.participant_ids);
    map.set(batchEntryFingerprint(row.item_name, ids), row.id);
  }
  return map;
}

async function performanceExistsForEntry(entryId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM performances WHERE event_entry_id = ${entryId} LIMIT 1
  ` as Array<{ id: string }>;
  return rows.length > 0;
}

async function ensurePerformanceForEntry(
  eventEntry: { id: string },
  entry: PendingBatchEntry,
  unifiedDb: { getDancerById: (id: string) => Promise<{ name?: string } | null> },
  db: { createPerformance: (performance: Omit<Performance, 'id'>) => Promise<{ id: string }> }
): Promise<void> {
  if (await performanceExistsForEntry(eventEntry.id)) return;

  const participantNames: string[] = [];
  const ids = entry.participantIds || [];
  for (let i = 0; i < ids.length; i++) {
    try {
      const dancer = await unifiedDb.getDancerById(ids[i]);
      participantNames.push(dancer?.name || `Participant ${i + 1}`);
    } catch {
      participantNames.push(`Participant ${i + 1}`);
    }
  }

  const performanceContestantId =
    entry.participantIds?.length > 0 ? entry.participantIds[0] : entry.contestantId;

  await db.createPerformance({
    eventId: entry.eventId,
    eventEntryId: eventEntry.id,
    contestantId: performanceContestantId,
    title: entry.itemName,
    participantNames,
    duration: entry.estimatedDuration || 0,
    choreographer: entry.choreographer,
    mastery: entry.mastery,
    itemStyle: entry.itemStyle,
    status: 'scheduled',
    itemNumber: undefined,
    entryType: entry.entryType || 'live',
    videoExternalUrl: entry.videoExternalUrl || undefined,
    videoExternalType:
      entry.videoExternalType && ['youtube', 'vimeo', 'other'].includes(entry.videoExternalType)
        ? (entry.videoExternalType as 'youtube' | 'vimeo' | 'other')
        : undefined,
    musicFileUrl: entry.musicFileUrl || undefined,
    musicFileName: entry.musicFileName || undefined,
  });
}

/**
 * Create missing entries for a completed batch payment. Safe to call multiple times (webhook retries).
 */
export async function reconcileBatchEntriesFromPending(
  paymentId: string,
  entriesData: PendingBatchEntry[],
  source: 'webhook' | 'process_entries' | 'recovery_script' = 'webhook'
): Promise<BatchEntryCreationResult> {
  const result: BatchEntryCreationResult = { created: [], skipped: [], errors: [] };
  if (!paymentId || !Array.isArray(entriesData) || entriesData.length === 0) {
    return result;
  }

  const sql = getSql();
  const { db, unifiedDb } = await import('./database');
  const existingByFingerprint = await loadExistingFingerprintsForPayment(paymentId);

  for (let i = 0; i < entriesData.length; i++) {
    const entry = entriesData[i];
    const participantIds = parseParticipantIds(entry.participantIds);
    const fingerprint = batchEntryFingerprint(entry.itemName, participantIds);
    const existingId = existingByFingerprint.get(fingerprint);

    if (existingId) {
      result.skipped.push({
        itemName: entry.itemName,
        reason: 'already_exists',
        existingEntryId: existingId,
      });
      try {
        await ensurePerformanceForEntry({ id: existingId }, { ...entry, participantIds }, unifiedDb, db);
      } catch (perfErr) {
        console.warn(`⚠️ [${source}] Performance ensure failed for existing entry ${existingId}:`, perfErr);
      }
      continue;
    }

    try {
      const eventEntry = await db.createEventEntry({
        eventId: entry.eventId,
        contestantId: entry.contestantId,
        eodsaId: entry.eodsaId,
        participantIds,
        calculatedFee: entry.calculatedFee,
        paymentStatus: 'paid',
        paymentMethod: 'payfast',
        approved: true,
        qualifiedForNationals: true,
        itemNumber: undefined,
        itemName: entry.itemName,
        choreographer: entry.choreographer,
        mastery: entry.mastery,
        itemStyle: entry.itemStyle,
        estimatedDuration: entry.estimatedDuration,
        entryType: entry.entryType || 'live',
        musicFileUrl: entry.musicFileUrl || undefined,
        musicFileName: entry.musicFileName || undefined,
        videoFileUrl: undefined,
        videoFileName: undefined,
        videoExternalUrl: entry.videoExternalUrl || undefined,
        videoExternalType:
          entry.videoExternalType && ['youtube', 'vimeo', 'other'].includes(entry.videoExternalType)
            ? (entry.videoExternalType as 'youtube' | 'vimeo' | 'other')
            : undefined,
        performanceType: entry.performanceType,
      } as Parameters<typeof db.createEventEntry>[0]);

      await sql`
        UPDATE event_entries
        SET payment_id = ${paymentId},
            performance_type = COALESCE(performance_type, ${entry.performanceType || null})
        WHERE id = ${eventEntry.id}
      `;

      existingByFingerprint.set(fingerprint, eventEntry.id);

      await ensurePerformanceForEntry(eventEntry, { ...entry, participantIds }, unifiedDb, db);

      if (participantIds.length > 0 && entry.mastery) {
        try {
          await autoMarkRegistrationForParticipants(participantIds, entry.mastery);
        } catch (regErr) {
          console.warn(`⚠️ [${source}] Registration mark failed for ${eventEntry.id}:`, regErr);
        }
      }

      result.created.push({
        entryId: eventEntry.id,
        itemName: entry.itemName,
        performanceType: entry.performanceType,
        fee: entry.calculatedFee,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [${source}] Entry ${i + 1} (${entry.itemName}):`, error);
      result.errors.push({ itemName: entry.itemName, index: i, error: message });
    }
  }

  return result;
}

export function parsePendingEntriesData(raw: unknown): PendingBatchEntry[] {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(data)) return [];
  return data as PendingBatchEntry[];
}
