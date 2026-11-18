import { useEffect, useState } from 'react';
import { Bell, BellRing, Play } from 'lucide-react';
import barcode from '@/assets/barcode-poster.webp';
import crimson from '@/assets/crimson-veil-poster.webp';
import neon from '@/assets/neon-dreams-poster.webp';
import shadow from '@/assets/shadow-protocol-poster.webp';

const upcoming = [
  { id: 'next-chapter', title: 'The Next Chapter', day: '14', month: 'NOV', when: 'Streaming from 14 November', tags: ['Original', 'Drama', 'Hindi'], about: 'A family empire cracks open when a long-lost heir returns with a secret that could end everything.', image: shadow },
  { id: 'crimson-veil', title: 'Crimson Veil', day: '28', month: 'NOV', when: 'Streaming from 28 November', tags: ['Thriller', 'Mystery', 'Hindi'], about: 'A detective chasing a masked killer discovers the trail leads straight back to her own past.', image: crimson },
  { id: 'neon-dreams', title: 'Neon Dreams', day: '05', month: 'DEC', when: 'Streaming from 5 December', tags: ['Sci-Fi', 'Romance', 'English'], about: 'In a city that never sleeps, two strangers find each other inside a dream they share every night.', image: neon },
  { id: 'barcode', title: 'Barcode', day: '19', month: 'DEC', when: 'Streaming from 19 December', tags: ['Action', 'Crime', 'Tamil'], about: 'A courier finds a code that unlocks the biggest heist the country has never heard of.', image: barcode },
];

const KEY = 'nova:reminders';

export default function ComingSoon() {
  const [reminders, setReminders] = useState<string[]>([]);
  useEffect(() => {
    try { setReminders(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* ignore */ }
  }, []);
  const toggle = (id: string) => {
    const next = reminders.includes(id) ? reminders.filter((r) => r !== id) : [...reminders, id];
    setReminders(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-nova-black px-4 pb-16 pt-20 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-bold text-nova-text sm:text-2xl">Coming Soon</h1>
        <p className="mt-1 mb-6 text-sm text-nova-muted">Set a reminder and we'll let you know the moment it starts streaming.</p>

        <div className="space-y-8">
          {upcoming.map((item) => {
            const on = reminders.includes(item.id);
            return (
              <article key={item.id}>
                <div className="min-w-0 flex-1">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-nova-card ring-1 ring-white/5">
                    <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-nova-black/80 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded bg-[#0f1219]/[0.92] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-nova-text">
                      Trailer
                    </span>
                    <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#0f1219]/[0.92]">
                      <Play className="h-4 w-4 fill-current text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                    </span>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white">{item.when}</p>
                      <h2 className="mt-0.5 text-lg font-bold text-white">{item.title}</h2>
                    </div>
                    <button
                      onClick={() => toggle(item.id)}
                      aria-pressed={on}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${on ? 'bg-white/10 text-white' : 'nova-pill-solid text-white'}`}
                    >
                      {on ? <BellRing className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> : <Bell className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />}
                      {on ? 'Reminder set' : 'Remind me'}
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-white/95">{item.about}</p>
                  <p className="mt-2 text-xs text-white/95">{item.tags.join('  •  ')}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
