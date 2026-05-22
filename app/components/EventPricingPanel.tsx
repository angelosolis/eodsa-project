'use client';

import { Event } from '@/lib/types';
import { eventUsesFlatPricing } from '@/lib/event-pricing';

function getCurrencySymbol(currency?: string): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return 'R';
  }
}

function formatAmount(symbol: string, amount: number): string {
  if (!amount || amount <= 0) return '—';
  return `${symbol}${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

type EventPricingPanelProps = {
  event: Pick<
    Event,
    | 'currency'
    | 'soloPrice'
    | 'duetPrice'
    | 'groupPrice'
    | 'registrationFee'
    | 'discountEnabled'
    | 'discountMinEntries'
    | 'discountAmount'
    | 'registrationFeePerDancer'
    | 'solo1Fee'
    | 'solo2Fee'
    | 'solo3Fee'
    | 'soloAdditionalFee'
    | 'duoTrioFeePerDancer'
    | 'groupFeePerDancer'
    | 'largeGroupFeePerDancer'
  >;
  compact?: boolean;
  className?: string;
};

export default function EventPricingPanel({ event, compact = false, className = '' }: EventPricingPanelProps) {
  const symbol = getCurrencySymbol(event.currency);
  const usesFlat = eventUsesFlatPricing(event);

  const regFee = usesFlat
    ? (event.registrationFee ?? 0)
    : (event.registrationFeePerDancer ?? 0);

  const rows: { icon: string; label: string; detail: string }[] = [];

  if (usesFlat) {
    const solo = event.soloPrice ?? 0;
    const duet = event.duetPrice ?? 0;
    const group = event.groupPrice ?? 0;

    if (solo > 0) {
      rows.push({ icon: '💃', label: 'Solo', detail: `${formatAmount(symbol, solo)} per solo` });
    }
    if (duet > 0) {
      rows.push({
        icon: '👯',
        label: 'Duet / Trio',
        detail: `${formatAmount(symbol, duet)} per dancer (duet ×2, trio ×3)`,
      });
    }
    if (group > 0) {
      rows.push({
        icon: '🎭',
        label: 'Group',
        detail: `${formatAmount(symbol, group)} per dancer (total = rate × group size)`,
      });
    }
  } else {
    const solo1 = event.solo1Fee ?? 0;
    const solo2 = event.solo2Fee ?? 0;
    const solo3 = event.solo3Fee ?? 0;
    const soloAdd = event.soloAdditionalFee ?? 0;
    const duoTrio = event.duoTrioFeePerDancer ?? 0;
    const groupSmall = event.groupFeePerDancer ?? 0;
    const groupLarge = event.largeGroupFeePerDancer ?? 0;

    if (solo1 > 0) {
      rows.push({
        icon: '💃',
        label: 'Solo packages',
        detail: [
          solo1 > 0 ? `1st ${formatAmount(symbol, solo1)}` : null,
          solo2 > 0 ? `2 solos ${formatAmount(symbol, solo2)}` : null,
          solo3 > 0 ? `3 solos ${formatAmount(symbol, solo3)}` : null,
          soloAdd > 0 ? `extra ${formatAmount(symbol, soloAdd)} each` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    }
    if (duoTrio > 0) {
      rows.push({
        icon: '👯',
        label: 'Duet / Trio',
        detail: `${formatAmount(symbol, duoTrio)} per dancer`,
      });
    }
    if (groupSmall > 0 || groupLarge > 0) {
      rows.push({
        icon: '🎭',
        label: 'Group',
        detail: [
          groupSmall > 0 ? `4–9 dancers: ${formatAmount(symbol, groupSmall)}/dancer` : null,
          groupLarge > 0 ? `10+ dancers: ${formatAmount(symbol, groupLarge)}/dancer` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    }
  }

  const discountN = event.discountMinEntries ?? 0;
  const discountAmt = event.discountAmount ?? 0;
  const hasDiscount = usesFlat && event.discountEnabled && discountN > 0 && discountAmt > 0;

  if (rows.length === 0 && regFee <= 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border border-emerald-500/20 bg-emerald-500/5 ${compact ? 'p-4' : 'p-5 sm:p-6'} ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className={`font-semibold text-emerald-200 ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
          Entry fees & pricing
        </h3>
      </div>

      <ul className={`space-y-2.5 ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}>
        {rows.map((row) => (
          <li key={row.label} className="flex gap-2.5 text-slate-200">
            <span className="shrink-0" aria-hidden>
              {row.icon}
            </span>
            <span>
              <span className="font-medium text-white">{row.label}</span>
              <span className="text-slate-400"> — </span>
              <span className="text-slate-300">{row.detail}</span>
            </span>
          </li>
        ))}
        {regFee > 0 && (
          <li className="flex gap-2.5 text-slate-200 pt-1 border-t border-slate-600/40">
            <span className="shrink-0" aria-hidden>
              📋
            </span>
            <span>
              <span className="font-medium text-white">Registration</span>
              <span className="text-slate-400"> — </span>
              <span className="text-slate-300">
                {formatAmount(symbol, regFee)} per dancer, once per event (if not already registered)
              </span>
            </span>
          </li>
        )}
        {hasDiscount && (
          <li className="flex gap-2.5 text-amber-200/90">
            <span className="shrink-0" aria-hidden>
              ✨
            </span>
            <span>
              <span className="font-medium text-amber-200">Solo discount</span>
              <span className="text-amber-200/80">
                {' '}
                — {formatAmount(symbol, discountAmt)} off every {discountN}
                {discountN === 1 ? 'st' : discountN === 2 ? 'nd' : discountN === 3 ? 'rd' : 'th'} solo per dancer
              </span>
            </span>
          </li>
        )}
      </ul>

      {!compact && (
        <p className="text-xs text-slate-500 mt-3">
          Final total depends on your cart (entries + new registrations). PayFast fees may apply at checkout.
        </p>
      )}
    </div>
  );
}
