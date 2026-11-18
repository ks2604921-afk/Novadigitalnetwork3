import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Crown, Film, Sparkles, Tv } from 'lucide-react';
import Logo from '@/nova/components/Logo';
import { TRIAL_OFFER } from '@/nova/profile-rules';

const PREMIUM_PLANS = [
  {
    name: 'Trial',
    price: `₹${TRIAL_OFFER.priceRupees}`,
    period: `${TRIAL_OFFER.durationMonths} mo`,
    note: `Then ₹${TRIAL_OFFER.renewalPriceRupees}/mo on ${TRIAL_OFFER.renewalPlan}`,
    features: ['720p HD streaming', '1 screen at a time'],
  },
  {
    name: 'Premium',
    price: '₹130',
    period: 'mo',
    note: 'Most Popular',
    features: ['4K Ultra HD + HDR', '2 screens at a time', 'Ad-free cinema'],
  },
  {
    name: 'Super Premium',
    price: '₹150',
    period: 'mo',
    note: 'Best Value',
    features: ['4K + Dolby Atmos', '4 screens at a time', 'Early access drops'],
  },
] as const;

type Props = {
  phone: string;
  onContinueGuest: () => void;
  onSelectPlan: (planName: string) => void;
  onSwitchAccount: () => void;
};

export default function PremiumGuestPoster({
  phone,
  onContinueGuest,
  onSelectPlan,
  onSwitchAccount,
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<string>('Premium');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const maskedPhone =
    phone.length >= 6 ? `${phone.slice(0, 4)}xxxx${phone.slice(-2)}` : phone;

  const content = (
    <div
      data-testid="premium-guest-poster"
      role="dialog"
      aria-modal="true"
      aria-label="NOVA Premium Guest Pass"
      className="fixed inset-0 z-[190] overflow-y-auto bg-[#07080d] text-white antialiased"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.3),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.2),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col justify-between px-5 py-8 sm:px-8 sm:py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <Logo size="lg" />
          <div className="flex items-center gap-3">
            {maskedPhone && (
              <span className="rounded-full border border-white/20 bg-[#0f1219]/[0.92] px-3.5 py-1.5 text-xs font-medium text-white">
                +91 {maskedPhone}
              </span>
            )}
            <button
              type="button"
              onClick={onSwitchAccount}
              className="text-xs font-semibold text-white transition hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.85)]"
            >
              Use another number
            </button>
          </div>
        </header>

        {/* Main Premium Guest Showcase (poster-free) */}
        <main className="my-8 grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-white">
              <Crown className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <span>NOVA Premium Guest Pass</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Experience Cinema in{' '}
                <span className="bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f472b6] bg-clip-text text-transparent">
                  Ultra HD
                </span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-white sm:text-base">
                Start with a ₹{TRIAL_OFFER.priceRupees} trial for {TRIAL_OFFER.durationMonths} month
                or explore trending originals right now as a guest.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 pt-1 text-xs font-medium text-white">
              <span className="inline-flex items-center gap-1.5">
                <Film className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.75)]" />
                4K HDR + Dolby Atmos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Tv className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.75)]" />
                TV, Mobile &amp; Web
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.75)]" />
                Zero Ads on Premium
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/[0.14] bg-[#0f1219]/[0.92] p-6 shadow-[0_28px_90px_-24px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <h2 className="text-lg font-bold tracking-tight text-white">
                Choose Your Experience
              </h2>
              <p className="mt-1 text-xs text-white/90">
                Select a plan preview or continue browsing as guest.
              </p>

              <div className="mt-4 space-y-2.5">
                {PREMIUM_PLANS.map((plan) => {
                  const active = selectedPlan === plan.name;
                  return (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition ${
                        active
                          ? 'border-nova-accent bg-nova-accent/15 ring-1 ring-nova-accent/50'
                          : 'border-white/[0.12] bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{plan.name}</span>
                            <span className="text-[11px] font-medium text-white/90">{plan.note}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/90">
                            {plan.features.map((f) => (
                              <span key={f} className="inline-flex items-center gap-1">
                                <Check className="h-3 w-3 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-lg font-extrabold text-white">{plan.price}</span>
                          <span className="text-[11px] text-white/90">/{plan.period}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => onSelectPlan(selectedPlan)}
                  className="nova-pill-solid flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-[0_12px_32px_-8px_rgba(236,72,153,0.4)] transition hover:brightness-110"
                >
                  <span>Continue with {selectedPlan}</span>
                  <ChevronRight className="h-4 w-4 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.75)]" />
                </button>

                <button
                  type="button"
                  onClick={onContinueGuest}
                  className="flex h-11 w-full items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.1]"
                >
                  Explore as Guest
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center text-[11px] text-white/90">
          Plan selection previews your NOVA membership without charging payment.
        </footer>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
