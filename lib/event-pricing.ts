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
}

function toAmount(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getFixedEntryPrice(entryType: string, event: EventPricingConfig): number {
  const normalized = (entryType || '').toLowerCase();
  if (normalized === 'solo') return toAmount(event.soloPrice, 0);
  if (normalized === 'duet' || normalized === 'trio') return toAmount(event.duetPrice, 0);
  if (normalized === 'group') return toAmount(event.groupPrice, 0);
  return 0;
}

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

  const entryCount = safeEntries.length;
  const discountEnabled = Boolean(event.discountEnabled);
  const minEntries = Math.max(0, toAmount(event.discountMinEntries, 0));
  const configuredDiscount = Math.max(0, toAmount(event.discountAmount, 0));
  const discount = discountEnabled && entryCount >= minEntries
    ? Math.min(configuredDiscount, subtotal)
    : 0;

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
    total
  };
}
