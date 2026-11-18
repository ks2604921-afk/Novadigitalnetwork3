import { useState } from 'react';
import { Clock, Eye, Flame, Heart, Play, X } from 'lucide-react';
import ResumePlayer from '@/nova/components/ResumePlayer';
import neonDreams from '@/assets/neon-dreams-poster.webp';
import shadowProtocol from '@/assets/shadow-protocol-poster.webp';
import crimsonVeil from '@/assets/crimson-veil-poster.webp';
import barcode from '@/assets/barcode-poster.webp';

type Clip = { title: string; show: string; duration: string; views: string; genre: string; art: string };

// Illustrative preview clips; every clip plays the uploaded sample until real clips are published.
const clips: Clip[] = [
  { title: 'Car Chase', show: 'Shadow Protocol', duration: '2:14', views: '1.2M', genre: 'Action', art: shadowProtocol },
  { title: 'The Confession', show: 'Crimson Veil', duration: '3:42', views: '890K', genre: 'Thriller', art: crimsonVeil },
  { title: 'Dream Sequence', show: 'Neon Dreams', duration: '1:58', views: '560K', genre: 'Sci-Fi', art: neonDreams },
  { title: 'The Code', show: 'Barcode', duration: '3:20', views: '1.8M', genre: 'Drama', art: barcode },
  { title: 'Rooftop Fight', show: 'Shadow Protocol', duration: '2:45', views: '720K', genre: 'Action', art: shadowProtocol },
  { title: 'Opening Scene', show: 'Neon Dreams', duration: '5:12', views: '3.1M', genre: 'Sci-Fi', art: neonDreams },
  { title: 'The Twist', show: 'Crimson Veil', duration: '2:30', views: '1.0M', genre: 'Thriller', art: crimsonVeil },
  { title: 'Last Signal', show: 'Barcode', duration: '4:01', views: '2.4M', genre: 'Drama', art: barcode },
];
const GENRES = ['All', 'Action', 'Thriller', 'Sci-Fi', 'Drama'];

type Meme = { id: string; top: string; bottom: string; show: string; likes: string; art: string };
// Illustrative preview memes made from bundled artwork until real memes are published.
const memes: Meme[] = [
  { id: 'm1', top: 'Me after one episode', bottom: 'Finishing the whole season', show: 'Neon Dreams', likes: '24K', art: neonDreams },
  { id: 'm2', top: 'When the plot twist hits', bottom: 'At 3 AM', show: 'Crimson Veil', likes: '18K', art: crimsonVeil },
  { id: 'm3', top: 'Mom: who are you talking to?', bottom: 'Me: the villain', show: 'Shadow Protocol', likes: '31K', art: shadowProtocol },
  { id: 'm4', top: 'Just 5 more minutes', bottom: 'Sunrise outside', show: 'Barcode', likes: '12K', art: barcode },
  { id: 'm5', top: 'Skip intro?', bottom: 'Never', show: 'Neon Dreams', likes: '9K', art: neonDreams },
  { id: 'm6', top: 'Friends spoiling the ending', bottom: 'Muted forever', show: 'Crimson Veil', likes: '27K', art: crimsonVeil },
];

const memeText = 'text-center text-sm font-black uppercase leading-tight text-nova-text [text-shadow:0_2px_6px_var(--color-nova-black)] sm:text-base';

function Memes() {
  const [open, setOpen] = useState<Meme | null>(null);
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {memes.map((meme) => (
          <button key={meme.id} onClick={() => setOpen(meme)} aria-label={`Open meme: ${meme.top}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-nova-line bg-nova-dark text-left transition duration-300 hover:-translate-y-1 hover:border-nova-accent/60">
            <img src={meme.art} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-nova-black/60 via-transparent to-nova-black/80" />
            <p className={`absolute inset-x-2 top-2 ${memeText}`}>{meme.top}</p>
            <p className={`absolute inset-x-2 bottom-7 ${memeText}`}>{meme.bottom}</p>
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-[10px] text-white">
              <span className="truncate">{meme.show}</span>
              <span className="flex shrink-0 items-center gap-1"><Heart className="h-3 w-3 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />{meme.likes}</span>
            </div>
          </button>
        ))}
      </div>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Meme" onClick={() => setOpen(null)} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f1219]/[0.92] p-4">
          <div onClick={(e) => e.stopPropagation()} className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-nova-line">
            <img src={open.art} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-nova-black/60 via-transparent to-nova-black/80" />
            <p className={`absolute inset-x-4 top-4 ${memeText} text-xl sm:text-2xl`}>{open.top}</p>
            <p className={`absolute inset-x-4 bottom-4 ${memeText} text-xl sm:text-2xl`}>{open.bottom}</p>
            <button onClick={() => setOpen(null)} aria-label="Close meme" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-nova-overlay text-white"><X className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /></button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Clips() {
  const [mode, setMode] = useState<'clip' | 'meme'>('clip');
  const [genre, setGenre] = useState('All');
  const [playing, setPlaying] = useState<string | null>(null);
  const list = genre === 'All' ? clips : clips.filter((clip) => clip.genre === genre);
  const [featured, ...rest] = list;

  return (
    <div className="px-4 pb-28 pt-24 text-nova-text sm:px-6 lg:px-12 lg:pb-12">
      <h1 className="sr-only">Clime</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {([['clip', 'Clip', 'nova-clime-clip'], ['meme', 'Meme', 'nova-clime-meme']] as const).map(([id, label, look]) => {
          const on = mode === id;
          return (
            <button key={id} onClick={() => setMode(id)} aria-pressed={on} aria-label={label}
              className={`${look} relative flex h-16 items-center justify-center rounded-[22px] text-nova-text transition duration-300 sm:h-20 sm:rounded-[26px] ${on ? 'nova-clime-active scale-[1.02]' : 'opacity-55 hover:opacity-85'}`}>
              <span className="relative text-2xl font-black italic tracking-tight sm:text-3xl">{label}</span>
            </button>
          );
        })}
      </div>

      {mode === 'meme' ? <Memes /> : <>
      <p className="mt-6 text-sm text-nova-muted">Short scenes from the shows you love</p>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GENRES.map((g) => (
          <button key={g} onClick={() => setGenre(g)} aria-pressed={genre === g}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${genre === g ? 'nova-pill-solid border-transparent text-nova-text' : 'border-nova-line bg-nova-dark text-nova-muted hover:text-nova-text'}`}>
            {g}
          </button>
        ))}
      </div>

      {featured && (
        <button onClick={() => setPlaying(featured.show)} aria-label={`Play ${featured.title}`}
          className="group relative mt-6 block aspect-[16/10] w-full overflow-hidden rounded-3xl border border-nova-line text-left sm:aspect-[21/9]">
          <img src={featured.art} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-nova-black via-nova-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-nova-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-8">
            <span className="nova-pill inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white"><Flame className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> Trending clip</span>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-4xl">{featured.title}</h2>
            <p className="mt-1 text-sm text-white/95">{featured.show} · {featured.genre}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-white">
              <span className="nova-pill-solid flex h-11 w-11 items-center justify-center rounded-full transition group-hover:scale-110"><Play className="h-5 w-5 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /></span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />{featured.duration}</span>
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />{featured.views} views</span>
            </div>
          </div>
        </button>
      )}

      {rest.length > 0 && <h2 className="mb-3 mt-8 text-lg font-bold text-white">More clips</h2>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {rest.map((clip) => (
          <button key={clip.title} onClick={() => setPlaying(clip.show)} aria-label={`Play ${clip.title}`}
            className="group relative aspect-[9/14] overflow-hidden rounded-2xl border border-nova-line bg-nova-dark text-left transition duration-300 hover:-translate-y-1 hover:border-nova-accent/60">
            <img src={clip.art} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-nova-black via-nova-black/30 to-transparent" />
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#0f1219]/[0.92] px-2 py-0.5 text-[10px] font-semibold text-white"><Clock className="h-3 w-3 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />{clip.duration}</span>
            <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-nova-line bg-[#0f1219]/[0.92] transition group-hover:scale-110 group-hover:border-transparent group-hover:bg-nova-accent">
              <Play className="h-5 w-5 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <h3 className="truncate text-sm font-bold text-white">{clip.title}</h3>
              <p className="truncate text-[11px] text-white/95">{clip.show}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-white/95"><Eye className="h-3 w-3 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />{clip.views}</p>
            </div>
          </button>
        ))}
      </div>

      </>}

      {playing && <ResumePlayer title={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
