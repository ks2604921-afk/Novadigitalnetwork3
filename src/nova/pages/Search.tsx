import { useEffect, useState } from 'react';
import { Search as SearchIcon, TrendingUp, Sparkles, Play, History, X } from 'lucide-react';
import { recommendTitles } from '@/lib/recommend.functions';
import type { Recommendation } from '@/lib/recommend.functions';
import { supabase } from '@/integrations/supabase/client';
import ResumePlayer from '@/nova/components/ResumePlayer';
import PosterImage from '@/nova/components/PosterImage';
import { ALL_TITLES, moodPicks, searchTitles, titlesByGenre } from '@/nova/discovery';
import { artworkFor } from '@/nova/related-catalog';

const RECENT_KEY = 'nova.recentSearches';
const GRADS = ['from-violet-900', 'from-fuchsia-900', 'from-indigo-900', 'from-rose-900', 'from-sky-900', 'from-emerald-900'];

const trending = ['Echoes of Tomorrow', 'Crimson Veil', 'Last Horizon', 'Neon Dreams', 'Shadow Protocol', 'Black Mirror City', 'The Order', 'Rogue State'];
const genres = ['Action', 'Drama', 'Sci-Fi', 'Thriller', 'Crime', 'Mystery', 'Comedy', 'Romance', 'Horror'];

type Added = { title: string; video_url: string | null };

export default function SearchPage({ bigScreen = false }: { bigScreen?: boolean }) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [picks, setPicks] = useState<Recommendation[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [added, setAdded] = useState<Added[]>([]);
  const [playing, setPlaying] = useState<{ title: string; src?: string | undefined } | null>(null);

  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
      if (Array.isArray(saved)) setRecent(saved.filter((x): x is string => typeof x === 'string').slice(0, 10));
    } catch { /* storage unavailable */ }
  }, []);

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 10);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* storage unavailable */ }
  };

  const runSearch = (term: string) => {
    setQuery(term);
    setGenre(null);
    saveRecent(term);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    supabase.from('shows').select('title, video_url').eq('is_published', true).limit(200)
      .then(({ data }) => setAdded((data ?? []) as Added[]));
  }, []);

  const play = (title: string) => {
    if (query.trim() && !genre) saveRecent(query);
    const src = added.find((a) => a.title === title)?.video_url ?? undefined;
    setPlaying({ title, src });
  };

  const results = genre ? titlesByGenre(genre) : searchTitles(query, added.map((a) => a.title));

  const getRecommendations = async () => {
    const m = mood.trim();
    if (!m || loading) return;
    setLoading(true);
    setAiError(null);
    const catalog = Array.from(new Set([...ALL_TITLES, ...added.map((a) => a.title)])).slice(0, 200);
    try {
      const res = await recommendTitles({ data: { mood: m, catalog } });
      setPicks(res.ok && res.picks.length ? res.picks : moodPicks(m));
    } catch {
      setPicks(moodPicks(m));
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ title, why }: { title: string; why?: string }) => (
    <button type="button" onClick={() => play(title)} className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-nova-card px-4 py-3 text-left transition-colors hover:border-nova-accent/40">
      <Play className="h-5 w-5 shrink-0 fill-white text-white" />
      <span className="min-w-0">
        <span className="block font-semibold text-white">{title}</span>
        {why && <span className="block text-sm text-nova-muted">{why}</span>}
      </span>
    </button>
  );

  const VideoCard = ({ title, index }: { title: string; index: number }) => {
    const art = artworkFor(title);
    return (
      <button
        type="button"
        data-tv-focusable="true"
        onClick={() => play(title)}
        aria-label={`Play ${title}`}
        className="tv-focusable group relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-nova-card text-left hover:scale-[1.03] hover:border-white/30"
      >
        {art ? (
          <PosterImage
            src={art}
            alt=""
            width={400}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${GRADS[index % GRADS.length]} to-nova-card`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0f1219]/[0.92] transition group-hover:bg-white/25">
          <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
        </span>
      </button>
    );
  };

  return (
    <div className="pt-24 pb-24 lg:pb-12 px-6 lg:px-12 text-white">
      <div className="relative max-w-2xl mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setGenre(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') saveRecent(query); }}
          placeholder={bigScreen ? 'Search shows, movies, drama...' : 'Search shows, movies, clips...'}
          className="nova-pill w-full border border-white/15 rounded-full pl-12 pr-4 py-3 text-white placeholder-white/75 focus:outline-none focus:ring-2 focus:ring-nova-red/50 transition"
        />
      </div>

      {(query.trim() || genre) && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">{genre ? `${genre} titles` : `Results for "${query.trim()}"`}</h2>
          {results.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{results.map((t, i) => <VideoCard key={t} title={t} index={i} />)}</div>
            : <p className="text-sm text-nova-muted">No titles found. Try another name or genre.</p>}
        </section>
      )}

      {!bigScreen && <section className="mb-10 max-w-2xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-white">
          <Sparkles className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> Recommend For My Mood
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && getRecommendations()}
            placeholder="e.g. something thrilling, or a light comedy tonight..."
            className="nova-pill min-w-0 flex-1 border border-white/15 rounded-full px-5 py-3 text-white placeholder-white/75 focus:outline-none focus:ring-2 focus:ring-nova-accent/50 transition"
          />
          <button type="button" onClick={getRecommendations} disabled={loading || !mood.trim()} className="nova-pill-solid rounded-full px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
            {loading ? 'Thinking…' : 'Suggest'}
          </button>
        </div>
        {aiError && <p className="mt-3 text-sm text-white">{aiError}</p>}
        {picks && <div className="mt-5 space-y-3">{picks.map((p) => <Card key={p.title} title={p.title} why={p.why} />)}</div>}
      </section>}

      {recent.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <History className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> Recent Searches
            </h2>
            <button type="button" onClick={clearRecent} className="text-sm font-medium text-white transition hover:opacity-90">Clear all</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {recent.map((term) => (
              <span key={term} className="nova-pill flex items-center gap-1 rounded-full border border-white/15 py-1 pl-4 pr-1.5 text-sm text-white">
                <button type="button" onClick={() => runSearch(term)} className="py-1 text-white transition hover:opacity-90">{term}</button>
                <button
                  type="button"
                  aria-label={`Remove ${term}`}
                  onClick={() => setRecent((prev) => {
                    const next = prev.filter((x) => x !== term);
                    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
                    return next;
                  })}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                </button>
              </span>
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-white">
            <TrendingUp className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> Trending Searches
          </h2>
          <div data-tv-row="true" className="flex flex-wrap gap-3">
            {trending.map((term) => (
              <button key={term} type="button" data-tv-focusable="true" onClick={() => runSearch(term)} className="tv-focusable nova-pill rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:brightness-125">
                {term}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Browse by Genre</h2>
        <div data-tv-row="true" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {genres.map((g) => (
            <button key={g} type="button" data-tv-focusable="true" onClick={() => { setGenre(g); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`tv-focusable h-20 rounded-lg bg-gradient-to-br from-nova-card to-nova-dark border flex items-center justify-center font-semibold ${genre === g ? 'border-nova-red' : 'border-white/5 hover:border-nova-red/40'}`}>
              {g}
            </button>
          ))}
        </div>
      </section>

      {playing && <ResumePlayer title={playing.title} src={playing.src} onClose={() => setPlaying(null)} />}
    </div>
  );
}
