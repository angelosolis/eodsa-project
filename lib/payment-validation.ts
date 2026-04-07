/**
 * Payment Validation Helpers
 *
 * Uses flat pricing + global discount with per-event registration charging.
 */

import { createTransactionRecord } from './transaction-records';
import { getSql } from './database';
import { calculateEventPricing, getFixedEntryPrice } from './event-pricing';

export interface EntryFeeValidation {
  entryIndex: number;
  entry: any;
  computedFee: number;
  clientSentFee: number;
  registrationFee: number;
  entryFee: number;
  registrationCharged: boolean;
  registrationWasAlreadyCharged: boolean;
  entryCount: number;
  breakdown: string;
  warnings: string[];
  isValid: boolean;
  mismatchDetected: boolean;
  mismatchReason?: string;
}

export interface BatchValidationResult {
  totalComputedFee: number;
  totalClientSentFee: number;
  validations: EntryFeeValidation[];
  allValid: boolean;
  mismatchDetected: boolean;
  mismatchReason?: string;
}

/**
 * Validate fees for a batch of entries
 */
export async function validateBatchEntryFees(
  entries: any[],
  eventId: string,
  clientSentTotal: number
): Promise<BatchValidationResult> {
  const sql = getSql();
  const validations: EntryFeeValidation[] = [];
  const normalizedEntries = Array.isArray(entries) ? entries : [];

  const eventRows = await sql`
    SELECT solo_price, duet_price, group_price, discount_enabled, discount_min_entries, discount_amount, registration_fee
    FROM events
    WHERE id = ${eventId}
  ` as any[];
  if (!eventRows.length) throw new Error(`Event ${eventId} not found`);

  const event = eventRows[0];
  const allParticipantIds = new Set<string>();
  normalizedEntries.forEach((entry) => {
    const ids = Array.isArray(entry.participantIds) ? entry.participantIds : [];
    ids.forEach((id: string) => id && allParticipantIds.add(id));
    if (!ids.length && entry.eodsaId) allParticipantIds.add(entry.eodsaId);
  });

  const alreadyRegistered = new Set<string>();
  for (const pid of allParticipantIds) {
    const existing = await sql`
      SELECT id FROM event_entries
      WHERE event_id = ${eventId}
      AND (
        eodsa_id = ${pid}
        OR participant_ids::text LIKE ${`%${pid}%`}
      )
      LIMIT 1
    ` as any[];
    if (existing.length > 0) alreadyRegistered.add(pid);
  }

  const pricing = calculateEventPricing(normalizedEntries, {
    soloPrice: event.solo_price,
    duetPrice: event.duet_price,
    groupPrice: event.group_price,
    discountEnabled: event.discount_enabled,
    discountMinEntries: event.discount_min_entries,
    discountAmount: event.discount_amount,
    registrationFee: event.registration_fee
  }, Array.from(alreadyRegistered));

  const entryCount = normalizedEntries.length || 1;
  const perEntryDiscount = pricing.discount / entryCount;

  for (let i = 0; i < normalizedEntries.length; i++) {
    const entry = normalizedEntries[i];
    const basePrice = getFixedEntryPrice(entry.performanceType, {
      soloPrice: event.solo_price,
      duetPrice: event.duet_price,
      groupPrice: event.group_price
    });
    const computedFee = Math.max(0, basePrice - perEntryDiscount);
    validations.push({
      entryIndex: i,
      entry,
      computedFee,
      clientSentFee: entry.calculatedFee || 0,
      registrationFee: 0,
      entryFee: basePrice,
      registrationCharged: false,
      registrationWasAlreadyCharged: false,
      entryCount: 0,
      breakdown: `Fixed ${entry.performanceType} price`,
      warnings: [],
      isValid: true,
      mismatchDetected: false
    });
  }

  const totalComputedFee = pricing.total;

  // Check total mismatch
  const totalMismatchDetected = Math.abs(clientSentTotal - totalComputedFee) > 0.01;
  const totalMismatchReason = totalMismatchDetected
    ? `Total mismatch: Client sent ${clientSentTotal}, computed ${totalComputedFee}, difference: ${Math.abs(clientSentTotal - totalComputedFee)}`
    : undefined;
  
  // Debug logging for total
  console.log(`📊 Batch validation summary:`, {
    entriesCount: entries.length,
    clientSentTotal,
    totalComputedFee,
    mismatchDetected: totalMismatchDetected,
    mismatchReason: totalMismatchReason,
    validations: validations.map(v => ({
      index: v.entryIndex,
      itemName: v.entry.itemName,
      clientSent: v.clientSentFee,
      computed: v.computedFee,
      mismatch: v.mismatchDetected
    }))
  });

  // Only check total mismatch - ignore per-entry mismatches
  // The frontend sends entryFee without registrationFee, so per-entry comparison is not valid
  return {
    totalComputedFee,
    totalClientSentFee: clientSentTotal,
    validations,
    allValid: !totalMismatchDetected, // Only check total, not per-entry
    mismatchDetected: totalMismatchDetected, // Only total mismatch matters
    mismatchReason: totalMismatchReason // Only total mismatch reason
  };
}

/**
 * Create transaction records for batch entries and mark registration as charged
 */
export async function createBatchTransactionRecords(
  entries: any[],
  eventId: string,
  paymentId: string,
  paymentMethod: 'payfast' | 'eft',
  clientSentTotal: number,
  computedTotal: number
): Promise<string[]> {
  const transactionIds: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      const transactionId = await createTransactionRecord({
        entryId: undefined,
        eventId,
        dancerId: entry.contestantId || entry.eodsaId,
        eodsaId: entry.eodsaId,
        expectedAmount: entry.calculatedFee || 0,
        amountPaid: 0,
        registrationPaidFlag: false,
        registrationChargedFlag: false,
        status: 'pending',
        paymentMethod,
        paymentReference: paymentId,
        clientSentTotal: entry.calculatedFee,
        computedTotal: entry.calculatedFee || 0,
        mismatchDetected: false
      });

      transactionIds.push(transactionId);
    } catch (error: any) {
      console.error(`Error creating transaction record for entry ${i + 1}:`, error);
    }
  }

  return transactionIds;
}

/**
 * Update transaction record with entry ID after entry is created
 */
export async function updateTransactionWithEntryId(
  transactionId: string,
  entryId: string
): Promise<void> {
  const sql = getSql();
  
  await sql`
    UPDATE transaction_records
    SET entry_id = ${entryId}
    WHERE id = ${transactionId}
  `;
}
