import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import Logo from '@/nova/components/Logo';

type GuestWelcomeProps = {
  onExplore?: () => void;
  onLogin?: () => void;
  onContinue?: () => void;
};

type LegalDoc = 'terms' | 'privacy' | null;

export default function GuestWelcome({ onExplore, onLogin, onContinue }: GuestWelcomeProps) {
  const [sheet, setSheet] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  useEffect(() => {
    if (!sheet && !legalDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (legalDoc) setLegalDoc(null);
        else setSheet(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, legalDoc]);

  useEffect(() => {
    if (!onContinue || legalDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target instanceof HTMLElement ? e.target : null;
        if (target?.dataset['welcomeLegal'] === 'true') return;
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onContinue, legalDoc]);

  return (
    <div role="dialog" aria-label="Welcome to NOVA" className="fixed inset-0 z-[140] overflow-hidden bg-nova-black">
      <style>{`@keyframes novaSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes novaFade{from{opacity:0}to{opacity:1}}`}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src="/assets/aistudio/image_fe2e737_928d888c.jpg"
          alt=""
          className="nova-poster-drift h-full w-full object-cover opacity-70 blur-[4px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nova-black/90 via-nova-black/50 to-nova-black/35" />
      </div>

      {onContinue ? (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.22),transparent_60%)]" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-8 py-10 sm:px-14 lg:px-20">
            <div className="w-full text-left">
              <div className="mb-5 flex justify-start">
                <Logo size="xl" />
              </div>
              <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.65)] sm:text-3xl lg:text-[42px] md:whitespace-nowrap">
                Welcome in your universe of entertainment
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                Continuing confirms you are 18+ and accept our{' '}
                <button
                  type="button"
                  data-welcome-legal="true"
                  onClick={() => setLegalDoc('terms')}
                  className="cursor-pointer rounded px-0.5 font-bold text-white underline decoration-white/60 underline-offset-[3px] transition hover:text-nova-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
                >
                  Terms of Use
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  data-welcome-legal="true"
                  onClick={() => setLegalDoc('privacy')}
                  className="cursor-pointer rounded px-0.5 font-bold text-white underline decoration-white/60 underline-offset-[3px] transition hover:text-nova-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
                >
                  Privacy Policy
                </button>
                .
              </p>

              <button
                type="button"
                onClick={onContinue}
                className="nova-pill-solid mt-7 flex h-13 w-full max-w-[320px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#ec4899] px-6 text-base font-bold text-white ring-1 ring-white/30 shadow-[0_12px_36px_-8px_rgba(124,58,237,0.75)] transition hover:brightness-110 active:scale-[0.98]"
              >
                <span>Continue</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.28),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 via-45% to-transparent" />

          <div className="relative z-10 mx-auto flex h-full max-w-2xl flex-col items-center justify-end px-6 pb-12 pt-8 text-center sm:pb-16">
            <div className="flex w-full flex-col items-center">
              <div className="mb-4 flex flex-col items-center">
                <Logo size="xl" />
                <h1 className="mt-5 bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-3xl font-extrabold leading-[1.12] tracking-tight text-transparent drop-shadow-[0_0_18px_rgba(139,92,246,0.55)] sm:text-5xl">
                  Welcome in your universe of entertainment
                </h1>
              </div>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
                Continuing confirms you are 18+ and accept our{' '}
                <button
                  type="button"
                  data-welcome-legal="true"
                  onClick={() => setLegalDoc('terms')}
                  className="cursor-pointer rounded px-0.5 font-bold text-white underline decoration-white/60 underline-offset-[3px] transition hover:text-nova-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
                >
                  Terms of Use
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  data-welcome-legal="true"
                  onClick={() => setLegalDoc('privacy')}
                  className="cursor-pointer rounded px-0.5 font-bold text-white underline decoration-white/60 underline-offset-[3px] transition hover:text-nova-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-accent"
                >
                  Privacy Policy
                </button>
                .
              </p>
              <button
                type="button"
                onClick={() => setSheet(true)}
                className="mt-8 flex h-[60px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a130df] via-[#7e2af8] to-[#2f1668] text-xl font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.7)] active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          </div>
        </>
      )}

      {legalDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={legalDoc === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
          className="fixed inset-0 z-20 overflow-y-auto bg-[#0f1219]/[0.92] px-6 py-8 text-left text-white"
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setLegalDoc(null)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                aria-label="Close legal document"
                onClick={() => setLegalDoc(null)}
                className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {legalDoc === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
            </h2>
            {legalDoc === 'terms' ? (
              <div className="mt-5 space-y-5 text-sm leading-relaxed text-white/90">
                <p>Welcome to NOVA. By accessing or using NOVA on your TV, web, or mobile device, you confirm that you are at least 18 years old and agree to these Terms of Use.</p>
                <section className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">1. Your Account</h3>
                  <p className="mt-1">You sign in with your mobile number. Keep your account access private and do not share verification codes with others.</p>
                </section>
                <section className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">2. Personal Streaming</h3>
                  <p className="mt-1">All movies, series, clips, and live channels on NOVA are for personal, non-commercial viewing only.</p>
                </section>
                <section className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">3. Content &amp; Availability</h3>
                  <p className="mt-1">Titles, languages, and features may be updated over time. Using NOVA responsibly keeps your access active across devices.</p>
                </section>
              </div>
            ) : (
              <div className="mt-5 space-y-5 text-sm leading-relaxed text-white/90">
                <p>This Privacy Policy explains what information NOVA collects and how it is used to deliver your streaming experience.</p>
                <section className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">1. Information We Use</h3>
                  <p className="mt-1">Your mobile number, profile preferences, language choices, watchlist, and device details used to run playback.</p>
                </section>
                <section className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">2. How It Helps You</h3>
                  <p className="mt-1">To personalize recommendations, remember your profiles and resume position, and send alerts you enable in Notifications.</p>
                </section>
                <section className="border-t border-white/10 pt-4">
                  <h3 className="font-semibold text-white">3. Your Control</h3>
                  <p className="mt-1">You can manage your profiles, notification preferences, and account settings any time from Profile.</p>
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {sheet && (
        <div className="absolute inset-0 z-10 flex items-end justify-center">
          <button
            aria-label="Close"
            onClick={() => setSheet(false)}
            className="absolute inset-0 bg-[#0f1219]/[0.92]"
            style={{ animation: 'novaFade .25s ease-out' }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nova-login-sheet-title"
            className="relative w-full max-w-md rounded-t-[28px] border-t border-white/10 bg-nova-dark px-6 pb-8 pt-3 shadow-[0_-20px_60px_-10px_rgba(124,58,237,0.35)]"
            style={{ animation: 'novaSheetUp .35s cubic-bezier(.22,1,.36,1)' }}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mb-3 flex justify-center">
              <Logo size="sm" />
            </div>
            <h2 id="nova-login-sheet-title" className="text-center text-2xl font-extrabold tracking-tight text-white">
              Login to enjoy
            </h2>
            <p className="mt-1.5 bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-center text-xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_12px_rgba(139,92,246,0.45)]">
              universe of entertainment
            </p>
            <button
              onClick={onLogin}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-[#a130df] via-[#7e2af8] to-[#2f1668] py-4 text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.7)] active:scale-[0.98]"
            >
              Login
            </button>
            <button
              onClick={onExplore}
              className="mt-3 w-full rounded-full border border-white/20 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/[0.06] active:scale-[0.98]"
            >
              Let's explore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
