import { Baby, User } from 'lucide-react';

export default function AvatarArt({ avatar, kid = false }: { avatar?: string | undefined; kid?: boolean }) {
  if (!avatar) {
    return kid
      ? <Baby className="h-[52%] w-[52%] text-nova-text" strokeWidth={1.4} />
      : <User className="h-[52%] w-[52%] text-nova-text" strokeWidth={1.4} />;
  }

  if (avatar === 'normal') {
    return <User className="h-[52%] w-[52%] text-nova-text" strokeWidth={1.5} />;
  }

  switch (avatar) {
    case 'iron-hero':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-iron-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="100%" stopColor="#1c0a12" />
            </linearGradient>
            <linearGradient id="av-iron-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-iron-bg)" />
          <circle cx="50" cy="52" r="36" fill="#b91c1c" />
          <path d="M22 44 Q24 20 50 18 Q76 20 78 44 L73 74 Q64 88 50 90 Q36 88 27 74 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
          <path d="M31 28 L42 22 L44 33 L56 33 L58 22 L69 28 L72 47 L66 54 L63 72 L56 80 L44 80 L37 72 L34 54 L28 47 Z" fill="url(#av-iron-gold)" />
          <path d="M33 48 L45 50 L43 55 L34 53 Z" fill="#38bdf8" />
          <path d="M67 48 L55 50 L57 55 L66 53 Z" fill="#38bdf8" />
          <rect x="43" y="69" width="14" height="3.5" rx="1.5" fill="#78350f" />
          <circle cx="50" cy="91" r="6" fill="#38bdf8" opacity="0.85" />
        </svg>
      );

    case 'anime-boy-shadow':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ab1-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#31105c" />
              <stop offset="100%" stopColor="#0b0918" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ab1-bg)" />
          <path d="M18 100 C22 76 78 76 82 100 Z" fill="#1e1b4b" />
          <path d="M37 76 L50 86 L63 76 L57 68 L43 68 Z" fill="#7c3aed" />
          <rect x="43" y="64" width="14" height="13" rx="5" fill="#fcd5bd" />
          <ellipse cx="50" cy="49" rx="18" ry="20" fill="#fde2cf" />
          <ellipse cx="42" cy="51" rx="3" ry="3.6" fill="#1e1b4b" />
          <ellipse cx="58" cy="51" rx="3" ry="3.6" fill="#1e1b4b" />
          <circle cx="43" cy="50" r="1.1" fill="#38bdf8" />
          <circle cx="59" cy="50" r="1.1" fill="#38bdf8" />
          <path d="M46 61 Q50 63 54 61" fill="none" stroke="#b46b55" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M24 46 L29 24 L40 16 L51 12 L63 17 L74 26 L77 48 L70 36 L63 42 L56 32 L48 41 L40 31 L32 41 Z" fill="#17152b" />
          <path d="M36 22 L48 28 L61 20" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        </svg>
      );

    case 'anime-boy-flame':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ab2-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c2d12" />
              <stop offset="100%" stopColor="#14090c" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ab2-bg)" />
          <path d="M18 100 C24 75 76 75 82 100 Z" fill="#18181b" />
          <path d="M36 77 L50 90 L64 77" fill="none" stroke="#ef4444" strokeWidth="4" />
          <rect x="43" y="64" width="14" height="12" rx="5" fill="#f7c8ad" />
          <ellipse cx="50" cy="49" rx="18" ry="20" fill="#fbd7c2" />
          <ellipse cx="42" cy="51" rx="3.2" ry="3.5" fill="#15803d" />
          <ellipse cx="58" cy="51" rx="3.2" ry="3.5" fill="#15803d" />
          <circle cx="43" cy="50" r="1.2" fill="#ffffff" />
          <circle cx="59" cy="50" r="1.2" fill="#ffffff" />
          <path d="M44 60 Q50 64 57 59" fill="none" stroke="#a15843" strokeWidth="2" strokeLinecap="round" />
          <path d="M23 47 L28 22 L42 13 L53 11 L68 18 L77 32 L76 48 L67 35 L58 39 L50 28 L42 38 L32 34 Z" fill="#dc2626" />
          <path d="M31 24 L45 18 L57 26" fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'anime-boy-cyber':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ab3-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0f3f5c" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ab3-bg)" />
          <path d="M18 100 C24 76 76 76 82 100 Z" fill="#0f172a" />
          <rect x="43" y="64" width="14" height="12" rx="5" fill="#fbd8c5" />
          <ellipse cx="50" cy="49" rx="18" ry="20" fill="#fde3d3" />
          <path d="M36 47 L64 47 L61 55 L39 55 Z" fill="#06b6d4" opacity="0.88" />
          <path d="M39 50 L46 50 M54 50 L61 50" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
          <path d="M46 61 L54 61" stroke="#9e6353" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M25 46 C24 22 40 13 52 14 C65 14 76 24 75 46 L68 35 L59 38 L51 29 L42 37 L32 35 Z" fill="#e2e8f0" />
          <rect x="23" y="40" width="6" height="16" rx="3" fill="#06b6d4" />
          <rect x="71" y="40" width="6" height="16" rx="3" fill="#06b6d4" />
        </svg>
      );

    case 'anime-boy-neon':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ab4-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#0b0914" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ab4-bg)" />
          <path d="M18 100 C23 76 77 76 82 100 Z" fill="#312e81" />
          <rect x="43" y="64" width="14" height="12" rx="5" fill="#fbd5bd" />
          <ellipse cx="50" cy="49" rx="18" ry="20" fill="#fde1cf" />
          <ellipse cx="42" cy="51" rx="3" ry="3.5" fill="#2563eb" />
          <ellipse cx="58" cy="51" rx="3" ry="3.5" fill="#2563eb" />
          <circle cx="43" cy="50" r="1.2" fill="#ffffff" />
          <circle cx="59" cy="50" r="1.2" fill="#ffffff" />
          <path d="M45 60 Q50 63 55 60" fill="none" stroke="#a66452" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M23 47 L26 24 L39 14 L51 10 L65 15 L75 26 L77 47 L67 34 L59 40 L51 28 L42 39 L33 34 Z" fill="#facc15" />
          <path d="M34 39 L40 32 L46 38 M54 38 L60 32 L66 39" fill="none" stroke="#854d0e" strokeWidth="1.6" />
        </svg>
      );

    case 'anime-girl-sakura':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ag1-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#831843" />
              <stop offset="100%" stopColor="#140814" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ag1-bg)" />
          <path d="M16 42 Q12 66 20 82 Q28 74 28 52 Z" fill="#f472b6" />
          <path d="M84 42 Q88 66 80 82 Q72 74 72 52 Z" fill="#f472b6" />
          <path d="M20 100 C25 76 75 76 80 100 Z" fill="#3b0764" />
          <path d="M40 78 L50 88 L60 78" fill="#fbcfe8" />
          <rect x="44" y="64" width="12" height="12" rx="5" fill="#fde0d0" />
          <ellipse cx="50" cy="49" rx="18" ry="19" fill="#ffe6d9" />
          <ellipse cx="42" cy="51" rx="3.4" ry="4.2" fill="#9333ea" />
          <ellipse cx="58" cy="51" rx="3.4" ry="4.2" fill="#9333ea" />
          <circle cx="43.2" cy="49.5" r="1.4" fill="#ffffff" />
          <circle cx="59.2" cy="49.5" r="1.4" fill="#ffffff" />
          <circle cx="37" cy="56" r="3" fill="#fda4af" opacity="0.55" />
          <circle cx="63" cy="56" r="3" fill="#fda4af" opacity="0.55" />
          <path d="M46 60 Q50 63 54 60" fill="none" stroke="#db7093" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M27 48 C27 22 40 16 50 16 C60 16 73 22 73 48 L67 36 L58 38 L50 30 L42 38 L33 36 Z" fill="#f472b6" />
          <circle cx="29" cy="40" r="4" fill="#fef08a" />
          <circle cx="71" cy="40" r="4" fill="#fef08a" />
        </svg>
      );

    case 'anime-girl-cyber':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ag2-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#090714" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ag2-bg)" />
          <path d="M24 38 L31 21 L42 30 Z" fill="#ec4899" />
          <path d="M76 38 L69 21 L58 30 Z" fill="#ec4899" />
          <path d="M20 100 C25 76 75 76 80 100 Z" fill="#1e1b4b" />
          <rect x="44" y="64" width="12" height="12" rx="5" fill="#fde0d0" />
          <ellipse cx="50" cy="49" rx="18" ry="19" fill="#ffe5d9" />
          <ellipse cx="42" cy="51" rx="3.4" ry="4" fill="#ec4899" />
          <ellipse cx="58" cy="51" rx="3.4" ry="4" fill="#ec4899" />
          <circle cx="43" cy="49.5" r="1.4" fill="#ffffff" />
          <circle cx="59" cy="49.5" r="1.4" fill="#ffffff" />
          <path d="M46 60 Q50 62 54 60" fill="none" stroke="#be6a7a" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M27 56 C25 26 37 16 50 16 C63 16 75 26 73 56 L68 38 L57 35 L49 40 L41 35 L32 38 Z" fill="#8b5cf6" />
          <rect x="22" y="42" width="6" height="14" rx="3" fill="#22d3ee" />
          <rect x="72" y="42" width="6" height="14" rx="3" fill="#22d3ee" />
        </svg>
      );

    case 'anime-girl-starlight':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ag3-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#090c18" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ag3-bg)" />
          <path d="M24 38 C18 60 20 82 26 95 L74 95 C80 82 82 60 76 38 Z" fill="#eab308" />
          <path d="M20 100 C25 76 75 76 80 100 Z" fill="#1d4ed8" />
          <rect x="44" y="64" width="12" height="12" rx="5" fill="#fde2d2" />
          <ellipse cx="50" cy="49" rx="18" ry="19" fill="#ffe7da" />
          <ellipse cx="42" cy="51" rx="3.4" ry="4" fill="#10b981" />
          <ellipse cx="58" cy="51" rx="3.4" ry="4" fill="#10b981" />
          <circle cx="43" cy="49.5" r="1.4" fill="#ffffff" />
          <circle cx="59" cy="49.5" r="1.4" fill="#ffffff" />
          <path d="M46 60 Q50 63 54 60" fill="none" stroke="#c9725d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M26 48 C26 22 40 15 50 15 C60 15 74 22 74 48 L66 35 L58 37 L50 29 L42 37 L34 35 Z" fill="#facc15" />
          <polygon points="66,27 68,31 72,31 69,34 70,38 66,36 62,38 63,34 60,31 64,31" fill="#ec4899" />
        </svg>
      );

    case 'anime-girl-crimson':
      return (
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <defs>
            <linearGradient id="av-ag4-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#09070d" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#av-ag4-bg)" />
          <path d="M23 36 C19 60 21 82 27 95 L73 95 C79 82 81 60 77 36 Z" fill="#1e293b" />
          <path d="M20 100 C25 76 75 76 80 100 Z" fill="#881337" />
          <rect x="44" y="64" width="12" height="12" rx="5" fill="#fde0d0" />
          <ellipse cx="50" cy="49" rx="18" ry="19" fill="#ffe6d9" />
          <ellipse cx="42" cy="51" rx="3.4" ry="4" fill="#e11d48" />
          <ellipse cx="58" cy="51" rx="3.4" ry="4" fill="#e11d48" />
          <circle cx="43" cy="49.5" r="1.4" fill="#ffffff" />
          <circle cx="59" cy="49.5" r="1.4" fill="#ffffff" />
          <path d="M46 60 Q50 62.5 54 60" fill="none" stroke="#b96363" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M27 50 C27 22 40 16 50 16 C60 16 73 22 73 50 L68 38 L50 37 L32 38 Z" fill="#0f172a" />
          <rect x="31" y="34" width="8" height="4" rx="2" fill="#f43f5e" />
          <rect x="61" y="34" width="8" height="4" rx="2" fill="#f43f5e" />
        </svg>
      );

    default:
      return <span aria-hidden>{avatar}</span>;
  }
}
