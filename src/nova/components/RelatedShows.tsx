import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getRelatedTitles,
  getSeasonsForTitle,
  getSimilarTitles,
  isSeriesTitle,
  parseSeriesTitle,
} from '@/nova/related-catalog';

type BrowseTab = 'watch-next' | 'similar' | 'episodes';

export const WATCH_LATER_SIGN_MS = 1500;

function WatchNextOptionButton({ title, compact = false }: { title: string; compact?: boolean }) {
  const queueKey = `nova-watch-next:${title}`;
  const watchlistKey = `nova-watchlist:${title}`;
  const [signed, setSigned] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSigned(false);
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [title]);

  const handleClick = () => {
    try {
      localStorage.setItem(queueKey, 'true');
      localStorage.setItem(watchlistKey, 'true');
    } catch {
      /* storage off */
    }
    setSigned(true);
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = null;
      setSigned(false);
    }, WATCH_LATER_SIGN_MS);
  };

  return (
    <button
      type="button"
      data-testid="plate-watch-next-btn"
      aria-label={signed ? `${title} added to Watch Later` : `Add ${title} to Watch Later`}
      aria-pressed={signed}
      onClick={handleClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors ${
        signed
          ? 'border-[#FF00B8] bg-gradient-to-r from-[#7200FF]/40 to-[#FF00B8]/35 text-white shadow-[0_0_12px_rgba(255,0,184,0.3)]'
          : 'border-white/15 bg-white/[0.08] text-white hover:border-white/35 hover:bg-white/[0.16]'
      } ${compact ? 'mt-1.5 h-8 w-full px-2' : 'mt-2 h-9 w-full px-3'}`}
    >
      {signed ? (
        <Check data-testid="watch-later-check-sign" className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.75} />
      ) : (
        <Plus data-testid="watch-later-plus-sign" className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>Watch Later</span>
    </button>
  );
}

export default function RelatedShows({
  title,
  onPlay,
  contentType,
  variant = 'page',
  onClose,
}: {
  title: string;
  onPlay: (title: string) => void;
  contentType?: 'movie' | 'series' | 'video' | undefined;
  variant?: 'page' | 'shelf';
  onClose?: (() => void) | undefined;
}) {
  const isSeries = isSeriesTitle(title, contentType);
  const parsed = useMemo(() => parseSeriesTitle(title), [title]);
  const [tab, setTab] = useState<BrowseTab>('watch-next');
  const [selectedSeason, setSelectedSeason] = useState<number>(parsed.seasonNumber);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setSelectedSeason(parsed.seasonNumber);
    if (!isSeries && tab === 'episodes') {
      setTab('watch-next');
    }
  }, [title, isSeries, parsed.seasonNumber, tab]);

  useEffect(() => {
    if (variant !== 'shelf') return;
    const focusTimer = window.setTimeout(() => {
      tabRefs.current[tab]?.focus();
    }, 20);
    return () => window.clearTimeout(focusTimer);
    // Focus initial tab once when shelf mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  const tabs = useMemo(
    () =>
      isSeries
        ? [
            { id: 'watch-next' as const, label: 'Watch Next' },
            { id: 'similar' as const, label: 'Something Similar' },
            { id: 'episodes' as const, label: 'Episodes' },
          ]
        : [
            { id: 'watch-next' as const, label: 'Watch Next' },
            { id: 'similar' as const, label: 'Something Similar' },
          ],
    [isSeries],
  );

  const watchNextItems = useMemo(() => getRelatedTitles(title), [title]);
  const similarItems = useMemo(() => getSimilarTitles(title), [title]);
  const seasons = useMemo(() => (isSeries ? getSeasonsForTitle(title) : []), [isSeries, title]);
  const activeSeasonData = seasons.find(s => s.season === selectedSeason) ?? seasons[0];

  const nextEpisodeTarget = useMemo(() => {
    if (!isSeries || !seasons.length) return null;
    const curSeason = seasons.find(s => s.season === parsed.seasonNumber) ?? seasons[0]!;
    const nextInSeason = curSeason.episodes.find(e => e.episode === parsed.episodeNumber + 1);
    if (nextInSeason) {
      return {
        season: curSeason.season,
        episode: nextInSeason,
        playTitle: `${parsed.baseTitle} · S${curSeason.season}:E${nextInSeason.episode}`,
      };
    }
    const nextSeason = seasons.find(s => s.season === curSeason.season + 1);
    const firstNext = nextSeason?.episodes[0];
    if (nextSeason && firstNext) {
      return {
        season: nextSeason.season,
        episode: firstNext,
        playTitle: `${parsed.baseTitle} · S${nextSeason.season}:E${firstNext.episode}`,
      };
    }
    return null;
  }, [isSeries, seasons, parsed]);

  const handleMainTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      const idx = tabs.findIndex(t => t.id === tab);
      const nextIdx =
        event.key === 'ArrowRight'
          ? (idx + 1) % tabs.length
          : (idx - 1 + tabs.length) % tabs.length;
      const nextTab = tabs[nextIdx]!.id;
      setTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    } else if (event.key === 'ArrowUp' && variant === 'shelf') {
      event.preventDefault();
      event.stopPropagation();
      onClose?.();
    } else if (event.key === 'ArrowDown' && variant === 'shelf') {
      event.preventDefault();
      event.stopPropagation();
      const root = event.currentTarget.closest('[data-testid="tv-player-shelf"]');
      const firstBodyBtn = root?.querySelector<HTMLElement>('[data-shelf-body] button:not([disabled])');
      firstBodyBtn?.focus();
    }
  };

  const handleShelfBodyKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (variant !== 'shelf') return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      tabRefs.current[tab]?.focus();
    }
  };

  const handlePlaySelection = (targetTitle: string) => {
    onPlay(targetTitle);
    if (variant === 'shelf') onClose?.();
  };

  const renderEpisodesPanel = (shelfMode: boolean) => (
    <div data-shelf-body className={shelfMode ? 'pt-3' : 'px-4 pt-4 sm:px-8'} onKeyDown={handleShelfBodyKeyDown}>
      <div role="tablist" aria-label="Seasons" className="scrollbar-hide mb-3 flex items-center gap-2 overflow-x-auto">
        {seasons.map(season => {
          const active = season.season === selectedSeason;
          return (
            <button
              key={season.season}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setSelectedSeason(season.season)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-accent sm:text-sm ${
                active
                  ? 'bg-gradient-to-r from-[#7200FF] to-[#FF00B8] text-white shadow-md'
                  : 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'
              }`}
            >
              {season.label}
            </button>
          );
        })}
      </div>

      <div
        data-testid="episodes-single-line"
        className="flex flex-col gap-2.5 pb-2"
      >
        {activeSeasonData?.episodes.map(ep => {
          const epCode = `S${activeSeasonData.season}:E${ep.episode}`;
          const isCurrent =
            parsed.seasonNumber === activeSeasonData.season &&
            parsed.episodeNumber === ep.episode &&
            parsed.hasEpisodeTag;
          const targetTitle = `${parsed.baseTitle} · ${epCode}`;
          return (
            <button
              key={epCode}
              type="button"
              aria-label={`Play ${parsed.baseTitle} ${activeSeasonData.label} Episode ${ep.episode}: ${ep.title}`}
              onClick={() => handlePlaySelection(targetTitle)}
              className={`group flex w-full items-center gap-3.5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-2 text-left transition-all hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-accent ${
                isCurrent ? 'ring-1 ring-[#FF00B8]/70' : ''
              }`}
            >
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-nova-card sm:w-40">
                <img
                  src={ep.artwork}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60">
                    <Play className="h-3.5 w-3.5 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                  </span>
                </span>
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <p className="truncate text-xs font-semibold text-white sm:text-sm">
                  {ep.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium tabular-nums text-white/75">
                  {`S${activeSeasonData.season}E${ep.episode} · ${ep.fullDate} · ${ep.durationMinutes} min`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderWatchNextPanel = (shelfMode: boolean) => {
    const cardSizeClass = shelfMode ? 'w-full' : 'w-44 shrink-0 sm:w-48';
    const hasNextEp = isSeries && Boolean(nextEpisodeTarget);
    const itemsToShow = watchNextItems.slice(0, hasNextEp ? 19 : 20);
    return (
      <div data-shelf-body className={shelfMode ? 'pt-3' : ''} onKeyDown={handleShelfBodyKeyDown}>
        {!shelfMode && (
          <h2 className="mb-3 mt-5 px-4 text-base font-semibold text-nova-text sm:px-8 sm:text-lg">
            {isSeries ? 'Up Next in Series & NOVA' : 'Watch Next on NOVA'}
          </h2>
        )}
        <div
          data-testid={shelfMode ? 'tv-watch-next-grid' : undefined}
          className={
            shelfMode
              ? 'tv-scroll-row scrollbar-hide grid grid-flow-col grid-rows-2 auto-cols-[12rem] gap-3 overflow-x-auto pb-2 sm:auto-cols-[13rem]'
              : 'tv-scroll-row scrollbar-hide flex items-stretch gap-3.5 overflow-x-auto px-4 pb-2 sm:px-8'
          }
        >
          {hasNextEp && nextEpisodeTarget && (
            <div className={cardSizeClass} data-testid="watch-next-card">
              <Button
                variant="novaAction"
                aria-label={`Play next episode ${nextEpisodeTarget.playTitle}`}
                onClick={() => handlePlaySelection(nextEpisodeTarget.playTitle)}
                className="group flex h-auto w-full flex-col items-stretch overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-0 text-left hover:border-white/35 hover:bg-white/[0.08]"
              >
                <span className="relative block aspect-video w-full overflow-hidden bg-nova-card">
                  <img
                    src={nextEpisodeTarget.episode.artwork}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[11px] font-bold text-white">
                    <Play className="h-3.5 w-3.5 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                  </span>
                </span>
              </Button>
              <WatchNextOptionButton title={parsed.baseTitle} compact />
            </div>
          )}
          {itemsToShow.map(item => (
            <div key={item.title} className={cardSizeClass} data-testid="watch-next-card">
              <Button
                variant="novaAction"
                aria-label={`Watch related ${item.title}`}
                onClick={() => handlePlaySelection(item.title)}
                className="group flex h-auto w-full flex-col items-stretch overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-0 text-left hover:border-white/35 hover:bg-white/[0.08]"
              >
                <span className="relative block aspect-video w-full overflow-hidden bg-nova-card">
                  <img
                    src={item.artwork}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[11px] font-bold text-white">
                    <Play className="h-3.5 w-3.5 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                  </span>
                </span>
              </Button>
              <WatchNextOptionButton title={item.title} compact />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSimilarPanel = (shelfMode: boolean) => (
    <div data-shelf-body className={shelfMode ? 'pt-3' : ''} onKeyDown={handleShelfBodyKeyDown}>
      {!shelfMode && (
        <h2 className="mb-3 mt-5 px-4 text-base font-semibold text-nova-text sm:px-8 sm:text-lg">
          More Like {parsed.baseTitle}
        </h2>
      )}
      <div
        data-testid={shelfMode ? 'tv-similar-grid' : undefined}
        className={
          shelfMode
            ? 'tv-scroll-row scrollbar-hide grid grid-flow-col grid-rows-2 auto-cols-[8.5rem] gap-3 overflow-x-auto pb-2 sm:auto-cols-[9.5rem]'
            : 'tv-scroll-row scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2 sm:px-8'
        }
      >
        {similarItems.map(item => (
          <div key={item.title} data-testid="similar-card" className={shelfMode ? 'w-full' : 'w-36 shrink-0 sm:w-44'}>
            <Button
              variant="novaAction"
              aria-label={`Play similar ${item.title}`}
              onClick={() => handlePlaySelection(item.title)}
              className="h-auto w-full rounded-lg p-0 hover:bg-transparent"
            >
              <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-lg border border-white/10 bg-nova-card">
                <img src={item.artwork} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </span>
            </Button>
            <WatchNextOptionButton title={item.title} compact />
          </div>
        ))}
      </div>
    </div>
  );

  if (variant === 'shelf') {
    return (
      <section
        data-testid="tv-player-shelf"
        aria-label="Watch Next, Something Similar and Episodes"
        className="pointer-events-auto absolute inset-x-0 bottom-0 z-[123] max-h-[68dvh] overflow-y-auto border-t border-nova-line bg-[#0f1219]/[0.92] px-6 pb-5 pt-3 shadow-[0_-24px_60px_rgba(0,0,0,0.9)] sm:px-8"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10">
          <div
            role="tablist"
            aria-label="Browse player options"
            onKeyDown={handleMainTabKeyDown}
            className="scrollbar-hide flex gap-6 overflow-x-auto"
          >
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                ref={el => {
                  tabRefs.current[id] = el;
                }}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`shrink-0 whitespace-nowrap border-b-2 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-accent ${
                  tab === id
                    ? 'border-[#FF00B8] text-white'
                    : 'border-transparent text-white/90 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {tab === 'watch-next' && renderWatchNextPanel(true)}
        {tab === 'similar' && renderSimilarPanel(true)}
        {tab === 'episodes' && isSeries && renderEpisodesPanel(true)}
      </section>
    );
  }

  return (
    <section aria-label="Related movies and series" className="mx-auto w-full max-w-5xl pb-8 pt-2">
      <div
        role="tablist"
        aria-label="Browse player options"
        onKeyDown={handleMainTabKeyDown}
        className="scrollbar-hide flex gap-6 overflow-x-auto border-b border-nova-line px-4 sm:px-8"
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            ref={el => {
              tabRefs.current[id] = el;
            }}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`shrink-0 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
              tab === id
                ? 'border-nova-text text-nova-text'
                : 'border-transparent text-nova-muted hover:text-nova-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'watch-next' && renderWatchNextPanel(false)}
      {tab === 'similar' && renderSimilarPanel(false)}
      {tab === 'episodes' && isSeries && renderEpisodesPanel(false)}
    </section>
  );
}
