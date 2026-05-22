export type PricingEntryType = 'Solo' | 'Duet' | 'Group' | 'Trio';

export interface PricingEntry {
  performanceType: PricingEntryType | string;
  participantIds?: string[];
  eodsaId?: string;
}

export interface EventPricingConfig {
  soloPrice?: number | null;
  duetPrice?: number | null;
  groupPrice?: number | null;
  discountEnabled?: boolean | null;
  /** Every Nth solo (per dancer) receives `discount_amount` off that line (e.g. 3 → 3rd, 6th, 9th…). */
  discountMinEntries?: number | null;
  discountAmount?: number | null;
  registrationFee?: number | null;
}

export interface EventPricingResult {
  itemizedEntries: Array<{ index: number; type: string; price: number }>;
  /** Sum of base line prices before nth-solo discounts. */
  subtotal: number;
  /** Sum of discounts applied on qualifying nth solos. */
  discount: number;
  registrationTotal: number;
  total: number;
  /** Discount amount taken off each entry line (same length as input entries); sums to `discount`. */
  entryDiscounts: number[];
}

function toAmount(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Primary grouping key: first participant, else eodsaId, else unique per row (no accidental cross-dancer bundling). */
export function getPricingDancerKey(entry: PricingEntry, index: number): string {
  const ids = Array.isArray(entry.participantIds) ? entry.participantIds.filter(Boolean) : [];
  if (ids.length > 0) return String(ids[0]);
  if (entry.eodsaId) return String(entry.eodsaId);
  return `__unassigned_${index}`;
}

/** Event uses flat per-item prices (solo/duet/group) rather than legacy per-dancer columns. */
export function eventUsesFlatPricing(event: {
  soloPrice?: number | null;
  duetPrice?: number | null;
  groupPrice?: number | null;
}): boolean {
  return (
    toAmount(event.soloPrice, 0) > 0 ||
    toAmount(event.duetPrice, 0) > 0 ||
    toAmount(event.groupPrice, 0) > 0
  );
}

export function getFixedEntryPrice(entryType: string, event: EventPricingConfig): number {
  const normalized = (entryType || '').toLowerCase();
  if (normalized === 'solo') return toAmount(event.soloPrice, 0);
  if (normalized === 'duet' || normalized === 'trio') return toAmount(event.duetPrice, 0);
  if (normalized === 'group') return toAmount(event.groupPrice, 0);
  return 0;
}

/**
 * Net performance fee for one line (nth-solo discount applied only to Solo when enabled).
 * `soloOrdinal` is 1-based count for this dancer (including existing event solos before this batch).
 */
export function getNetPerformanceLineParts(
  entry: PricingEntry,
  event: EventPricingConfig,
  soloOrdinal: number
): { gross: number; discount: number; net: number } {
  const gross = getFixedEntryPrice(entry.performanceType, event);
  const isSolo = (entry.performanceType || '').toLowerCase() === 'solo';
  const intervalN = Math.max(0, Math.floor(toAmount(event.discountMinEntries, 0)));
  const discCfg = Math.max(0, toAmount(event.discountAmount, 0));

  if (
    !isSolo ||
    !event.discountEnabled ||
    intervalN <= 0 ||
    discCfg <= 0 ||
    soloOrdinal <= 0 ||
    soloOrdinal % intervalN !== 0
  ) {
    return { gross, discount: 0, net: gross };
  }

  const lineDiscount = Math.min(discCfg, gross);
  return { gross, discount: lineDiscount, net: gross - lineDiscount };
}

/**
 * Flat line-item prices + **every Nth solo** discount per dancer (3rd/6th/9th when N=3).
 * Pass `existingSoloCountByDancer` with DB solo counts per participant id before this cart (so batch order + DB ordinals match checkout).
 */
export function calculateEventPricing(
  entries: PricingEntry[],
  event: EventPricingConfig,
  alreadyRegisteredDancerIds: string[] = [],
  existingSoloCountByDancer: Record<string, number> = {}
): EventPricingResult {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const entryDiscounts = new Array(safeEntries.length).fill(0);
  const itemizedEntries: EventPricingResult['itemizedEntries'] = [];

  /** Running solo ordinal per dancer within this batch (starts after DB count). */
  const batchSoloAdded: Record<string, number> = {};

  let subtotal = 0;
  let discount = 0;

  for (let i = 0; i < safeEntries.length; i++) {
    const entry = safeEntries[i];
    const base = getFixedEntryPrice(entry.performanceType, event);
    itemizedEntries.push({ index: i, type: entry.performanceType || 'Unknown', price: base });
    subtotal += base;

    const key = getPricingDancerKey(entry, i);
    const isSolo = (entry.performanceType || '').toLowerCase() === 'solo';

    if (!isSolo) continue;

    const priorDb = Math.max(0, Math.floor(existingSoloCountByDancer[key] ?? 0));
    const prevBatch = batchSoloAdded[key] ?? 0;
    batchSoloAdded[key] = prevBatch + 1;
    const soloOrdinal = priorDb + batchSoloAdded[key];

    const parts = getNetPerformanceLineParts(entry, event, soloOrdinal);
    if (parts.discount > 0) {
      entryDiscounts[i] = parts.discount;
      discount += parts.discount;
    }
  }

  const registrationFee = Math.max(0, toAmount(event.registrationFee, 0));
  const alreadyRegistered = new Set(alreadyRegisteredDancerIds.filter(Boolean));
  const newlyCharged = new Set<string>();

  for (const entry of safeEntries) {
    const ids = Array.isArray(entry.participantIds) ? entry.participantIds : [];
    if (ids.length > 0) {
      for (const id of ids) {
        if (id && !alreadyRegistered.has(id)) {
          newlyCharged.add(id);
        }
      }
      continue;
    }

    if (entry.eodsaId && !alreadyRegistered.has(entry.eodsaId)) {
      newlyCharged.add(entry.eodsaId);
    }
  }

  const registrationTotal = registrationFee * newlyCharged.size;
  const total = Math.max(0, subtotal - discount + registrationTotal);

  return {
    itemizedEntries,
    subtotal,
    discount,
    registrationTotal,
    total,
    entryDiscounts
  };
}
