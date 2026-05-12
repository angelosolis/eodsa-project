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
  discountMinEntries?: number | null;
  discountAmount?: number | null;
  registrationFee?: number | null;
}

export interface EventPricingResult {
  itemizedEntries: Array<{ index: number; type: string; price: number }>;
  subtotal: number;
  discount: number;
  registrationTotal: number;
  total: number;
  /** Discount amount allocated to each entry index (same length as input entries); sums to `discount`. */
  entryDiscounts: number[];
}

function toAmount(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Primary grouping key: first participant, else eodsaId, else unique per row (no accidental cross-dancer bundling). */
function dancerGroupKey(entry: PricingEntry, index: number): string {
  const ids = Array.isArray(entry.participantIds) ? entry.participantIds.filter(Boolean) : [];
  if (ids.length > 0) return String(ids[0]);
  if (entry.eodsaId) return String(entry.eodsaId);
  return `__unassigned_${index}`;
}

/**
 * Split a discount across entries proportionally by line price; fixes rounding on last line.
 */
function splitDiscountAcrossPrices(prices: number[], totalDiscount: number): number[] {
  const n = prices.length;
  if (n === 0 || totalDiscount <= 0) return [];
  const sum = prices.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const each = Math.floor((totalDiscount * 100) / n) / 100;
    const out = new Array(n).fill(each);
    const drift = Math.round((totalDiscount - each * n) * 100) / 100;
    if (n > 0) out[n - 1] = Math.round((out[n - 1] + drift) * 100) / 100;
    return out;
  }
  const raw = prices.map((p) => (p / sum) * totalDiscount);
  const rounded = raw.map((r) => Math.round(r * 100) / 100);
  const drift = Math.round((totalDiscount - rounded.reduce((a, b) => a + b, 0)) * 100) / 100;
  if (n > 0) rounded[n - 1] = Math.round((rounded[n - 1] + drift) * 100) / 100;
  return rounded;
}

export function getFixedEntryPrice(entryType: string, event: EventPricingConfig): number {
  const normalized = (entryType || '').toLowerCase();
  if (normalized === 'solo') return toAmount(event.soloPrice, 0);
  if (normalized === 'duet' || normalized === 'trio') return toAmount(event.duetPrice, 0);
  if (normalized === 'group') return toAmount(event.groupPrice, 0);
  return 0;
}

/**
 * Flat line-item prices + discount evaluated **per contestant** (same dancer / primary participant):
 * discount applies when that contestant's number of entries in this batch >= discount_min_entries.
 * Multiple different dancers each with 1 entry do **not** combine toward one discount.
 */
export function calculateEventPricing(
  entries: PricingEntry[],
  event: EventPricingConfig,
  alreadyRegisteredDancerIds: string[] = []
): EventPricingResult {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const itemizedEntries = safeEntries.map((entry, index) => {
    const price = getFixedEntryPrice(entry.performanceType, event);
    return { index, type: entry.performanceType || 'Unknown', price };
  });

  const subtotal = itemizedEntries.reduce((sum, item) => sum + item.price, 0);

  const discountEnabled = Boolean(event.discountEnabled);
  const minEntries = Math.max(0, toAmount(event.discountMinEntries, 0));
  const configuredDiscount = Math.max(0, toAmount(event.discountAmount, 0));

  const entryDiscounts = new Array(safeEntries.length).fill(0);
  let discount = 0;

  if (discountEnabled && configuredDiscount > 0 && minEntries > 0 && safeEntries.length > 0) {
    const groups = new Map<string, number[]>();
    safeEntries.forEach((entry, index) => {
      const key = dancerGroupKey(entry, index);
      const list = groups.get(key) || [];
      list.push(index);
      groups.set(key, list);
    });

    for (const indices of groups.values()) {
      if (indices.length < minEntries) continue;
      const prices = indices.map((i) => itemizedEntries[i]?.price ?? 0);
      const groupSubtotal = prices.reduce((a, b) => a + b, 0);
      const groupDiscount = Math.min(configuredDiscount, groupSubtotal);
      discount += groupDiscount;
      const parts = splitDiscountAcrossPrices(prices, groupDiscount);
      indices.forEach((entryIndex, j) => {
        entryDiscounts[entryIndex] = Math.round(((entryDiscounts[entryIndex] || 0) + (parts[j] || 0)) * 100) / 100;
      });
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
