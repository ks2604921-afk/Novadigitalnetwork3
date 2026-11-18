import { useId } from 'react';

/** The faceted geometric "N" used as NOVA's first letter everywhere. */
export default function NovaMark({ className = 'h-6 w-6' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="16 14 68 72" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-nova-red)" />
          <stop offset="100%" stopColor="var(--color-nova-accent)" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#9d174d" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3040" />
          <stop offset="100%" stopColor="#141820" />
        </linearGradient>
      </defs>
      <polygon points="16,14 31,14 31,86 16,86" fill={`url(#${id}c)`} stroke="#ffffff22" strokeWidth="0.8" />
      <polygon points="69,14 84,14 84,86 69,86" fill={`url(#${id}c)`} stroke="#ffffff22" strokeWidth="0.8" />
      <polygon points="16,14 31,14 84,86" fill={`url(#${id}a)`} />
      <polygon points="16,14 84,86 69,86" fill={`url(#${id}b)`} />
    </svg>
  );
}
