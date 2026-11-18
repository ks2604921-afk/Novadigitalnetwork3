import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  AudioLines,
  Info,
  Users,
} from 'lucide-react';

export type SmartFeatureTab = 'cowatch' | 'dialogue' | 'scene';

type SmartFeaturesOverlayProps = {
  roomId: string;
  companionUrl: string;
  onEnsureHostRoom: () => Promise<string>;
  onClose: () => void;
};

export default function SmartFeaturesOverlay({
  roomId,
  companionUrl,
  onEnsureHostRoom,
  onClose,
}: SmartFeaturesOverlayProps) {
  const [futurePopupOpen, setFuturePopupOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) {
      void onEnsureHostRoom();
    }
  }, [roomId, onEnsureHostRoom]);

  useEffect(() => {
    const first = rootRef.current?.querySelector<HTMLElement>('[data-dpad-item="true"]');
    first?.focus();
  }, [futurePopupOpen]);

  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'INPUT') return;
        event.preventDefault();
        event.stopPropagation();

        const scopeRoot = futurePopupOpen
          ? rootRef.current?.querySelector<HTMLElement>('[data-testid="future-feature-popup"]')
          : rootRef.current;
        const items = Array.from(
          scopeRoot?.querySelectorAll<HTMLElement>('[data-dpad-item="true"]:not([disabled])') ?? [],
        );
        if (items.length === 0) return;

        const currentIndex = items.findIndex((el) => el === document.activeElement);
        const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex =
          currentIndex === -1 ? 0 : (currentIndex + delta + items.length) % items.length;
        items[nextIndex]?.focus();
      }
    };
    window.addEventListener('keydown', onWindowKeyDown, true);
    return () => window.removeEventListener('keydown', onWindowKeyDown, true);
  }, [futurePopupOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === 'Escape' ||
      event.key === 'Backspace' ||
      event.key === 'BrowserBack' ||
      event.key === 'GoBack'
    ) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' && event.key === 'Backspace') return;
      event.preventDefault();
      event.stopPropagation();
      if (futurePopupOpen) {
        setFuturePopupOpen(false);
      } else {
        onClose();
      }
      return;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT') return;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const effectiveCompanionUrl =
    companionUrl || `/cowatch?room=${encodeURIComponent(roomId || 'CW-8492')}`;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Smart Features for You"
      data-testid="smart-features-panel"
      onKeyDown={handleKeyDown}
      onWheel={(event) => event.stopPropagation()}
      className="pointer-events-auto fixed inset-0 z-[140] flex flex-col overflow-y-auto bg-[#0f1219]/[0.92] text-white outline-none"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-7">
        {/* Header: Back Switch Only + Larger Colorful Title (No X cross icon) */}
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            data-dpad-item="true"
            data-testid="smart-features-back-btn"
            aria-label="Back"
            onClick={onClose}
            className="tv-focusable inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 text-xs font-semibold text-white hover:bg-white/[0.16] focus-visible:outline-none sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <h2 className="bg-gradient-to-r from-[#c084fc] via-[#ec4899] to-[#fbbf24] bg-clip-text text-center text-xl font-extrabold tracking-tight text-transparent sm:text-3xl">
            Smart Features for You
          </h2>

          <div className="w-16 sm:w-20" aria-hidden="true" />
        </header>

        {/* 3-Option Navigation Bar: Co-Watch, Dialogue Boost, Scene Info */}
        <nav
          aria-label="Smart Feature Sections"
          className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3"
        >
          {(
            [
              { id: 'cowatch', label: 'Co-Watch', Icon: Users, locked: false },
              { id: 'dialogue', label: 'Dialogue Boost', Icon: AudioLines, locked: true },
              { id: 'scene', label: 'Scene Info', Icon: Info, locked: true },
            ] as const
          ).map(({ id, label, Icon, locked }) => {
            const active = !locked && id === 'cowatch';
            return (
              <button
                key={id}
                type="button"
                data-dpad-item="true"
                aria-pressed={active}
                onClick={() => {
                  if (locked) {
                    setFuturePopupOpen(true);
                  }
                }}
                className={`tv-focusable flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold focus-visible:outline-none sm:text-sm ${
                  active
                    ? 'border-[#c084fc]/70 bg-white/[0.14] text-white'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.09] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Section Body */}
        <main className="mt-6 flex flex-1 flex-col justify-center">
          <section
            data-testid="tv-cowatch-card"
            aria-label="Co-Watch Room Controls"
            className="rounded-2xl border border-white/15 bg-[#0f1219]/[0.92] px-5 py-7 sm:px-8 sm:py-9"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Invite your friends to watch together
              </h3>
            </div>

            <div className="mt-8 grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
              {/* Left Side: QR Code */}
              <div
                data-testid="cowatch-qr-block"
                className="flex flex-col items-center justify-center text-center"
              >
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG
                    value={effectiveCompanionUrl}
                    size={152}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0b0716"
                    aria-label={`QR code to open Mobile Companion Dashboard for room ${roomId || 'CW-8492'}`}
                  />
                </div>
                <p className="mt-3.5 rounded-md bg-white px-3 py-1 text-xs font-extrabold tracking-wide text-[#09080f] shadow-[0_0_14px_rgba(255,255,255,0.3)] sm:text-sm">
                  Scan QR code to your phone
                </p>
              </div>

              {/* Middle Dividing Line */}
              <div className="h-px w-full bg-white/15 sm:hidden" aria-hidden="true" />
              <div className="hidden h-44 w-px bg-white/20 sm:block" aria-hidden="true" />

              {/* Right Side: White Highlighted Room ID */}
              <div className="flex flex-col items-center justify-center text-center">
                <p className="rounded-md bg-white px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[#09080f] shadow-[0_0_14px_rgba(255,255,255,0.3)]">
                  Room ID
                </p>
                <p
                  data-testid="cowatch-room-id"
                  className="mt-3 font-mono text-3xl font-extrabold tracking-[0.16em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)] sm:text-4xl"
                >
                  {roomId || 'CW-8492'}
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Upcoming Feature Popup for Dialogue Boost & Scene Info */}
      {futurePopupOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Next feature for you in future"
          data-testid="future-feature-popup"
          className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0f1219]/[0.92] p-4 sm:p-6"
          onClick={() => setFuturePopupOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#c084fc]/45 bg-[#121521] p-6 text-center text-white shadow-[0_28px_90px_rgba(124,58,237,0.45)] sm:p-8"
          >
            <div className="relative flex items-center justify-start">
              <button
                type="button"
                data-dpad-item="true"
                data-testid="future-feature-back-btn"
                aria-label="Back"
                onClick={() => setFuturePopupOpen(false)}
                className="tv-focusable inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.16] focus-visible:outline-none"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex flex-col items-center py-6">
              <h3 className="bg-gradient-to-r from-[#f5d0fe] via-[#ffffff] to-[#fbbf24] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
                Next feature for you in future
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
