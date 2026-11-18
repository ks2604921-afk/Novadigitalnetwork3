import { useEffect, useRef, useState } from 'react';

export const INTRO_DURATION_MS = 4200;
export const INTRO_REDUCED_DURATION_MS = 1400;

/**
 * Cinematic opening: a faceted geometric "N" draws itself with laser lines,
 * fills with a violet→pink prism, gets a light sweep, then the NOVA wordmark
 * and tagline settle in. Plays once per app launch.
 */
export default function StartupIntro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  const completedRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    completedRef.current = false;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const total = reduced ? INTRO_REDUCED_DURATION_MS : INTRO_DURATION_MS;
    const fade = window.setTimeout(() => setLeaving(true), total - 500);
    const done = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onDoneRef.current();
    }, total);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="NOVA intro"
      className={`ni-root fixed inset-0 z-[250] flex flex-col items-center justify-center overflow-hidden bg-nova-black ${leaving ? 'ni-leaving' : ''}`}
    >
      <div className="ni-glow pointer-events-none absolute inset-0" />
      <div className="ni-floor pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />


      <h1 aria-label="NOVA" className="ni-lockup flex items-center justify-center">
      <span className="ni-mark relative block h-28 w-28 shrink-0 sm:h-36 sm:w-36">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="ni-prism-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-nova-red)" />
              <stop offset="100%" stopColor="var(--color-nova-accent)" />
            </linearGradient>
            <linearGradient id="ni-prism-b" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#9d174d" />
            </linearGradient>
            <linearGradient id="ni-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a3040" />
              <stop offset="100%" stopColor="#141820" />
            </linearGradient>
            <linearGradient id="ni-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
          </defs>
          {/* Left & right obsidian bars */}
          <polygon className="ni-shape ni-d1" points="16,14 31,14 31,86 16,86" fill="url(#ni-bar)" />
          <polygon className="ni-shape ni-d2" points="69,14 84,14 84,86 69,86" fill="url(#ni-bar)" />
          {/* Diagonal prism beam, split into two facets */}
          <polygon className="ni-shape ni-d3" points="16,14 31,14 84,86" fill="url(#ni-prism-a)" />
          <polygon className="ni-shape ni-d4" points="16,14 84,86 69,86" fill="url(#ni-prism-b)" />
        </svg>
        <div className="ni-sweep pointer-events-none absolute inset-0" />
      </span>
      <span className="ni-letters-window block overflow-hidden" aria-hidden="true">
        <span className="ni-letters block text-6xl font-extrabold tracking-normal text-nova-text sm:text-7xl">OVA</span>
      </span>
      </h1>
      <div className="ni-rule mt-4 h-px w-24 bg-gradient-to-r from-transparent via-nova-red to-transparent" />
      <p className="ni-tag mt-4 text-[10px] uppercase tracking-normal text-nova-muted sm:text-xs">
        A Universe of Entertainment
      </p>
    </div>
  );
}
