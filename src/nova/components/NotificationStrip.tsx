import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ChevronLeft, ChevronRight, CheckCheck } from 'lucide-react';
import { listAnnouncements } from '@/lib/discovery.functions';
import ResumePlayer from '@/nova/components/ResumePlayer';

const SEEN_KEY = 'nova-notifications-seen';
const DEFAULT_LIVE_IMG = 'https://images.pexels.com/photos/25746377/pexels-photo-25746377.jpeg?auto=compress&cs=tinysrgb&h=200&w=320';

type Note = { id: string; label: string; title: string; text: string; time: string; img: string; read: boolean; path?: string };

const INITIAL: Note[] = [
  { id: 'n1', label: 'New episode from your watchlist', title: 'Maharani S3', text: 'Maharani S3 • Episode 5 is now streaming', time: 'Abhi', img: 'https://images.pexels.com/photos/24286060/pexels-photo-24286060.jpeg?auto=compress&cs=tinysrgb&h=200&w=320', read: false },
  { id: 'n2', label: 'Live soon', title: 'IND vs AUS', text: 'IND vs AUS match 7:30 PM se live', time: '2h', img: 'https://images.pexels.com/photos/29263907/pexels-photo-29263907.jpeg?auto=compress&cs=tinysrgb&h=200&w=320', read: false },
  { id: 'n3', label: 'Coming Friday', title: 'NOVA Original Trailer', text: 'Naya NOVA Original trailer dekhein', time: '1d', img: DEFAULT_LIVE_IMG, read: false },
];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return 'Abhi';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function NoteRow({ note, onOpen }: { note: Note; onOpen: (n: Note) => void }) {
  return (
    <button onClick={() => onOpen(note)} className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-2 text-left transition hover:bg-white/10">
      <img src={note.img} alt="" className="h-14 w-24 flex-shrink-0 rounded-lg object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-xs text-white/95">
          {!note.read && <span aria-label="Unread" className="h-1.5 w-1.5 shrink-0 rounded-full bg-nova-accent" />}
          {note.label} · {note.time}
        </p>
        <p className={`mt-0.5 line-clamp-2 text-sm ${note.read ? 'font-medium text-white/95' : 'font-semibold text-white'}`}>{note.text}</p>
      </div>
    </button>
  );
}

export default function NotificationStrip({ className = 'mt-6' }: { className?: string }) {
  const [notes, setNotes] = useState<Note[]>(INITIAL);
  const [pageOpen, setPageOpen] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const unread = notes.length;
  const latest = notes[0];

  // Seen notifications are remembered on this device and removed from the list.
  // Live announcements from Admin are merged ahead of built-in defaults.
  useEffect(() => {
    let cancelled = false;
    const readSeen = (): string[] => {
      try {
        return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') as string[];
      } catch {
        return [];
      }
    };

    const seen = readSeen();
    setNotes(INITIAL.filter((n) => !seen.includes(n.id)));

    void (async () => {
      try {
        const live = await listAnnouncements();
        if (cancelled || !Array.isArray(live) || live.length === 0) return;
        const currentSeen = readSeen();
        const liveNotes: Note[] = live
          .filter((item) => !currentSeen.includes(item.id))
          .map((item) => ({
            id: item.id,
            label: item.title,
            title: item.title,
            text: item.body,
            time: formatRelativeTime(item.created_at),
            img: DEFAULT_LIVE_IMG,
            read: false,
            path: item.path,
          }));
        const fallback = INITIAL.filter((n) => !currentSeen.includes(n.id));
        setNotes([...liveNotes, ...fallback]);
      } catch {
        /* Keep built-in items when backend is unreachable */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pageOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPageOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageOpen]);

  const dismiss = (ids: string[]) => {
    setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seen, ...ids])]));
    } catch { /* storage disabled */ }
  };

  const open = (note: Note) => {
    dismiss([note.id]);
    setPageOpen(false);
    if (note.path && note.path.startsWith('/') && note.path !== '/') {
      window.location.assign(note.path);
      return;
    }
    setPlaying(note.title);
  };

  const notificationsPage = pageOpen ? (
    <div
      data-testid="notifications-page"
      role="region"
      aria-label="Notifications page"
      className="fixed inset-0 top-16 z-[120] overflow-y-auto bg-nova-black pb-24 pt-6 text-white"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPageOpen(false)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ChevronLeft className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            Back
          </button>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => dismiss(notes.map((n) => n.id))}
              className="nova-pill flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-125"
            >
              <CheckCheck className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              Clear all
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Notifications</h1>
          {unread > 0 && (
            <span className="nova-pill-solid rounded-full px-2.5 py-0.5 text-xs font-bold text-white">
              {unread}
            </span>
          )}
        </div>

        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((n) => (
              <NoteRow key={n.id} note={n} onOpen={open} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
            <Bell className="mb-3 h-9 w-9 text-white/60" />
            <p className="text-base font-semibold text-white">No new notifications</p>
            <p className="mt-1 text-sm text-white/70">You&apos;re all caught up on shows, live matches, and releases.</p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <section className={className} aria-label="Notifications">
      <button
        type="button"
        aria-label="Open notifications page"
        onClick={() => setPageOpen(true)}
        className="mb-3 flex w-full items-center justify-between px-1 text-left"
      >
        <span className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          {unread > 0 && <span className="nova-pill-solid rounded-full px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
        </span>
        <ChevronRight className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
      </button>
      {latest ? (
        <NoteRow note={latest} onOpen={open} />
      ) : (
        <p className="px-1 text-xs text-white/70">No new notifications</p>
      )}

      {notificationsPage && (typeof document !== 'undefined' ? createPortal(notificationsPage, document.body) : notificationsPage)}

      {playing && <ResumePlayer title={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
