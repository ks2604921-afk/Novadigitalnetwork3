import { isOldNovaUser, normalizePhoneNumber } from '@/nova/user-account';

export type SubscriptionTier = 'none' | 'normal' | 'premium';

export type AccountSubscription = {
  planName: string;
  tier: SubscriptionTier;
  paid: boolean;
  actionLabel: 'Subscribe' | 'Upgrade' | null;
  fetchedAt: string;
  expiresAt: string | null;
};

export function formatFullPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '+91 98765 43210';
  if (digits.length < 10) return `+91 ${digits}`;
  const local = digits.slice(-10);
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

export function formatAccountDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function computeMonthlyExpiryIso(anchorIso?: string | null, now = new Date()): string {
  const DAY_MS = 86_400_000;
  if (anchorIso) {
    const start = new Date(anchorIso);
    if (!Number.isNaN(start.getTime())) {
      const candidate = new Date(start.getTime() + 30 * DAY_MS);
      if (candidate.getTime() > now.getTime()) {
        return candidate.toISOString();
      }
    }
  }
  return new Date(now.getTime() + 24 * DAY_MS).toISOString();
}

export function resolveFallbackSubscription(
  phone: string,
  now = new Date(),
): AccountSubscription {
  const clean = normalizePhoneNumber(phone);
  const fetchedAt = now.toISOString();
  // Default preview account (no explicit phone stored yet or seeded old user) carries the active Mobile 1 Month plan.
  const hasActiveNormalPlan = !clean || clean === '9876543210' || isOldNovaUser(clean);

  if (!hasActiveNormalPlan) {
    return {
      planName: 'No Active Plan',
      tier: 'none',
      paid: false,
      actionLabel: 'Subscribe',
      fetchedAt,
      expiresAt: null,
    };
  }

  return {
    planName: 'Mobile 1 Month',
    tier: 'normal',
    paid: true,
    actionLabel: 'Upgrade',
    fetchedAt,
    expiresAt: computeMonthlyExpiryIso(null, now),
  };
}
