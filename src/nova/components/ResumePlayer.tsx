import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Hls, { type MediaPlaylist } from 'hls.js';
import { ArrowLeft, Cast, Check, LoaderCircle, Lock, LockOpen, Maximize, Minimize, MoreHorizontal, Pause, Play, ChevronsLeft, ChevronsRight, Settings, Wifi, MonitorPlay, Volume2, MessageSquareText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerActions from '@/nova/components/PlayerActions';
import RelatedShows from '@/nova/components/RelatedShows';
import {
  buildSubtitleOptions,
  isHlsSource,
  switchHlsAudioTrack,
  switchHlsSubtitleTrack,
} from '@/nova/hls-tracks';
import SmartFeaturesOverlay from '@/nova/components/SmartFeaturesOverlay';
import { useCoWatchSync } from '@/nova/hooks/useCoWatchSync';
import { APP_LANGUAGES } from '@/nova/languages';
import { isDesktopDevice, isTvUserAgent } from '@/nova/watching-profile-rules';
import sampleVideo from '@/assets/nova_sample_video.mp4.asset.json';

import av1Video from '@/assets/nova_sample_av1.mp4.asset.json';
import hevcVideo from '@/assets/nova_sample_hevc.mp4.asset.json';

export const SAMPLE_VIDEO = sampleVideo.url;
/** Picks the most efficient codec the device can decode: AV1, then HEVC, then H.264. */
export function pickSampleSource(): string {
  if (typeof document === 'undefined') return SAMPLE_VIDEO;
  const probe = document.createElement('video');
  const can = (type: string) => typeof probe.canPlayType === 'function' && probe.canPlayType(type) === 'probably';
  if (can('video/mp4; codecs="av01.0.05M.08, mp4a.40.2"')) return av1Video.url;
  if (can('video/mp4; codecs="hvc1.1.6.L93.B0, mp4a.40.2"')) return hevcVideo.url;
  return SAMPLE_VIDEO;
}
const key = (title: string) => `nova-resume:${title}`;
const clock = (seconds: number) => {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
};

export function getSavedTime(title: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const value = Number(window.localStorage.getItem(key(title)));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch { return 0; }
}

function PlayerScreen({
  title,
  onClose,
  onSelect,
  src,
  contentType,
}: {
  title: string;
  onClose: () => void;
  onSelect: (title: string) => void;
  src?: string | undefined;
  contentType?: 'movie' | 'series' | 'video' | undefined;
}) {
  const [source] = useState(() => src || pickSampleSource());
  const hlsSource = isHlsSource(source);
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const attachVideo = useCallback((node: HTMLVideoElement | null) => {
    ref.current = node;
    setVideo(node);
  }, []);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [controls, setControls] = useState(true);
  const [settings, setSettings] = useState(false);
  const [locked, setLocked] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [castOpen, setCastOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [casting, setCasting] = useState(false);
  const [castMessage, setCastMessage] = useState('');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('Quality');
  const [hlsAudioTracks, setHlsAudioTracks] = useState<MediaPlaylist[]>([]);
  const [hlsSubtitleTracks, setHlsSubtitleTracks] = useState<MediaPlaylist[]>([]);
  const [speed, setSpeed] = useState(1);
  const [audioLang, setAudioLang] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('nova-app-language') : null;
      return saved || 'Hindi';
    } catch {
      return 'Hindi';
    }
  });
  const [subtitle, setSubtitle] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('nova-subtitle-language') : null;
      return saved || 'Off';
    } catch {
      return 'Off';
    }
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState(0);
  const [smartPillVisible, setSmartPillVisible] = useState(true);
  const audioLangRef = useRef(audioLang);
  const subtitleRef = useRef(subtitle);
  const isRemoteSyncRef = useRef(false);
  audioLangRef.current = audioLang;
  subtitleRef.current = subtitle;
  const coWatchSync = useCoWatchSync({
    title,
    preferredRole: 'host',
    participantName: 'TV Host',
    onRemotePlayback: (remotePlaying, remoteTime) => {
      const current = ref.current;
      if (!current) return;
      isRemoteSyncRef.current = true;
      try {
        if (Math.abs((current.currentTime || 0) - remoteTime) > 1.2) {
          current.currentTime = remoteTime;
          setTime(remoteTime);
        }
        if (remotePlaying && current.paused) {
          current.play().catch(() => undefined);
        } else if (!remotePlaying && !current.paused) {
          current.pause();
        }
      } finally {
        queueMicrotask(() => {
          isRemoteSyncRef.current = false;
        });
      }
    },
  });
  const startHostPartyRef = useRef(coWatchSync.startHostParty);
  startHostPartyRef.current = coWatchSync.startHostParty;
  const ensureHostRoom = useCallback(
    () => startHostPartyRef.current(ref.current?.currentTime ?? 0, Boolean(ref.current && !ref.current.paused), false),
    [],
  );
  // TV/desktop: the watch screen fills the whole screen and arrow Up/Down reveal the title or browse shelf.
  const [tv, setTv] = useState(false);
  useEffect(() => {
    const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
    setTv(isTvUserAgent(navigator.userAgent) || isDesktopDevice(navigator.userAgent, fine, window.innerWidth));
  }, []);

  useEffect(() => {
    if (!video) return;
    let hls: Hls | null = null;
    if (hlsSource && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      const syncTracks = () => {
        if (!hls) return;
        setHlsAudioTracks([...(hls.audioTracks ?? [])]);
        setHlsSubtitleTracks([...(hls.subtitleTracks ?? [])]);
      };
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        syncTracks();
        if (hls) {
          switchHlsAudioTrack(hls, video, audioLangRef.current);
          switchHlsSubtitleTrack(hls, video, subtitleRef.current);
        }
      });
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, syncTracks);
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, syncTracks);
      hls.loadSource(source);
      hls.attachMedia(video);
    } else if (hlsSource && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    }

    const save = () => {
      try {
        if (video.ended) localStorage.removeItem(key(title));
        else localStorage.setItem(key(title), String(Math.floor(video.currentTime)));
      } catch { /* Keep playback available when storage is disabled. */ }
    };
    const onLoaded = () => {
      setReady(true);
      setError('');
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      const saved = getSavedTime(title);
      if (saved > 0 && saved < video.duration - 2) video.currentTime = saved;
      switchHlsAudioTrack(hlsRef.current, video, audioLangRef.current);
      switchHlsSubtitleTrack(hlsRef.current, video, subtitleRef.current);
      video.play().catch(() => setControls(true));
    };
    const update = () => {
      setTime(video.currentTime);
      if (video.currentTime >= SMART_FEATURES_VISIBLE_MS / 1000) {
        setSmartPillVisible(false);
      }
      save();
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => { setPlaying(false); setControls(true); save(); };
    const onEnd = () => { setPlaying(false); setControls(true); save(); };
    const onError = () => { setReady(false); setError('Video could not load. Please try again.'); };
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', update);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnd);
    video.addEventListener('error', onError);
    if (video.readyState >= 1) onLoaded();
    return () => {
      save();
      video.pause();
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnd);
      video.removeEventListener('error', onError);
      if (hls) {
        hls.destroy();
        if (hlsRef.current === hls) hlsRef.current = null;
      }
    };
  }, [title, video, source, hlsSource]);

  useEffect(() => {
    if (!playing || settings || shelfOpen || castOpen || smartOpen || !controls) return;
    const timeout = window.setTimeout(() => {
      const focused = document.activeElement;
      if (!(focused instanceof HTMLElement && stageRef.current?.contains(focused) && focused.matches(':focus-visible'))) setControls(false);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [playing, settings, shelfOpen, castOpen, smartOpen, controls, activity]);

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const reveal = () => { setControls(true); setActivity(value => value + 1); };

  useEffect(() => {
    if (!tv) return;
    const onKey = (event: KeyboardEvent) => {
      if (settings || smartOpen) return;
      const eventTarget = event.target instanceof HTMLElement ? event.target : null;
      if (eventTarget?.closest('[data-testid="smart-features-pill"]')) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          event.stopPropagation();
          setControls(true);
          setActivity(value => value + 1);
          return;
        }
      }
      if (locked) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setControls(true);
          setActivity(value => value + 1);
        }
        return;
      }
      if (shelfOpen) {
        if (event.key === 'ArrowUp') {
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target || !target.closest('[data-testid="tv-player-shelf"]')) {
            event.preventDefault();
            setShelfOpen(false);
            setControls(true);
            setActivity(value => value + 1);
          }
        }
        return;
      }
      const current = ref.current;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCastOpen(false);
        setShelfOpen(true);
        setControls(true);
        setActivity(value => value + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setControls(true);
        setActivity(value => value + 1);
      } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && current && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        current.currentTime = Math.max(0, current.currentTime + (event.key === 'ArrowRight' ? 10 : -10));
        setControls(true);
        setActivity(value => value + 1);
      } else if ((event.key === ' ' || event.key === 'MediaPlayPause') && current && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        if (current.paused) current.play().catch(() => undefined); else current.pause();
        setControls(true);
        setActivity(value => value + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tv, settings, smartOpen, locked, shelfOpen]);
  const togglePlay = () => {
    const current = ref.current;
    if (!current) return;
    const willPlay = current.paused;
    if (willPlay) current.play().catch(() => setError('Playback could not start. Please try again.'));
    else current.pause();
    if (!isRemoteSyncRef.current && coWatchSync.roomId) {
      void coWatchSync.sendPlaybackSync(willPlay, current.currentTime || 0);
    }
    reveal();
  };
  const seek = (value: number) => {
    const current = ref.current;
    if (!current || !duration) return;
    current.currentTime = Math.min(duration, Math.max(0, value));
    setTime(current.currentTime);
    if (!isRemoteSyncRef.current && coWatchSync.roomId) {
      void coWatchSync.sendPlaybackSync(!current.paused, current.currentTime);
    }
    reveal();
  };
  // Language choices sit directly on the watch screen for the first 2 minutes after a video opens,
  // or for 1 minute after a viewer selects a language.
  const [langStripVisible, setLangStripVisible] = useState(true);
  const langHideTimerRef = useRef<number | null>(null);
  const scheduleLangStripHide = useCallback((delayMs: number) => {
    if (langHideTimerRef.current !== null) window.clearTimeout(langHideTimerRef.current);
    langHideTimerRef.current = window.setTimeout(() => {
      langHideTimerRef.current = null;
      setLangStripVisible(false);
    }, delayMs);
  }, []);
  useEffect(() => {
    scheduleLangStripHide(LANGUAGE_STRIP_MS);
    const smartTimer = window.setTimeout(() => {
      setSmartPillVisible(false);
    }, SMART_FEATURES_VISIBLE_MS);
    return () => {
      if (langHideTimerRef.current !== null) window.clearTimeout(langHideTimerRef.current);
      window.clearTimeout(smartTimer);
    };
  }, [scheduleLangStripHide]);
  const selectAudioLanguage = (lang: string) => {
    setAudioLang(lang);
    switchHlsAudioTrack(hlsRef.current, ref.current, lang);
    try { window.localStorage.setItem('nova-app-language', lang); } catch { /* ignore */ }
    // Wait 1 minute after selection before hiding the language rows.
    scheduleLangStripHide(LANGUAGE_STRIP_SELECT_MS);
  };
  const selectSubtitleLanguage = (sub: string) => {
    setSubtitle(sub);
    switchHlsSubtitleTrack(hlsRef.current, ref.current, sub);
    try { window.localStorage.setItem('nova-subtitle-language', sub); } catch { /* ignore */ }
  };
  const languageRows = getLanguageStripRows(audioLang);
  /** "More" opens Player Settings straight on the Audio Language tab. */
  const openLanguageSettings = () => {
    setCastOpen(false);
    setSmartOpen(false);
    setShelfOpen(false);
    setSettingsTab('Audio Language');
    setSettings(true);
    reveal();
  };
  const subtitleOptions = buildSubtitleOptions(hlsSubtitleTracks, video?.textTracks, subtitle);
  const toggleFullscreen = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stage.requestFullscreen) await stage.requestFullscreen();
      else {
        const native = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        if (native?.webkitEnterFullscreen) native.webkitEnterFullscreen();
        else setError('Fullscreen is not available in this browser.');
      }
    } catch { setError('Fullscreen is not available here. Try opening NOVA in a new tab.'); }
    reveal();
  };
  const triggerBrowserCast = async () => {
    const vid = ref.current as (HTMLVideoElement & {
      remote?: { prompt?: () => Promise<void>; state?: string };
      webkitShowPlaybackTargetPicker?: () => void;
    }) | null;

    if (vid?.remote && typeof vid.remote.prompt === 'function') {
      try {
        await vid.remote.prompt();
        setCasting(true);
        setCastMessage(`Casting "${title}"`);
        setCastOpen(true);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    if (vid && typeof vid.webkitShowPlaybackTargetPicker === 'function') {
      try {
        vid.webkitShowPlaybackTargetPicker();
        setCasting(true);
        setCastMessage(`Selecting AirPlay / Cast target for "${title}"`);
        setCastOpen(true);
        return;
      } catch {
        /* Fallback to Presentation API or inline guidance below. */
      }
    }

    const Pres = (window as Window & {
      PresentationRequest?: new (urls: string[]) => { start: () => Promise<unknown> };
    }).PresentationRequest;
    if (typeof Pres === 'function') {
      try {
        await new Pres([window.location.href]).start();
        setCasting(true);
        setCastMessage(`Casting "${title}" to external display`);
        setCastOpen(true);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    setCastMessage('Use your browser Cast menu or connect a TV on the same Wi-Fi to cast this video.');
    setCastOpen(true);
  };

  const handleCast = () => {
    reveal();
    setSettings(false);
    if (castOpen) {
      setCastOpen(false);
      return;
    }
    void triggerBrowserCast();
  };

  return (
    <Dialog.Root open onOpenChange={open => { if (!open && !locked) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          data-nova-player-open="true"
          data-nova-no-arrow-scroll="true"
          onEscapeKeyDown={event => {
            if (settings) {
              event.preventDefault();
              setSettings(false);
            } else if (smartOpen) {
              event.preventDefault();
              setSmartOpen(false);
            } else if (castOpen) {
              event.preventDefault();
              setCastOpen(false);
            } else if (shelfOpen) {
              event.preventDefault();
              setShelfOpen(false);
            } else if (locked) {
              event.preventDefault();
              reveal();
            }
          }}
          onInteractOutside={event => {
            if (smartOpen || locked) event.preventDefault();
          }}
          onOpenAutoFocus={event => { event.preventDefault(); if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus(); }}
          className="fixed inset-0 z-[120] overflow-y-auto bg-nova-black text-nova-text outline-none"
        >
          <Dialog.Title className="sr-only">Watch {title}</Dialog.Title>
          <div
            ref={stageRef}
            data-tv-player={tv || undefined}
            data-screen-locked={locked || undefined}
            className={`nova-video-stage relative w-full overflow-hidden bg-nova-video ${tv ? 'h-dvh' : 'aspect-video max-h-[72dvh]'}`}
            onPointerMove={reveal}
            onPointerEnter={reveal}
            onPointerLeave={event => { if (event.pointerType === 'mouse' && !settings && !shelfOpen && !castOpen && !smartOpen) setControls(false); }}
            onFocusCapture={reveal}
            onWheel={event => {
              if (!tv || locked || settings || smartOpen) return;
              const wheelTarget = event.target instanceof HTMLElement ? event.target : null;
              if (
                wheelTarget?.closest('[data-testid="smart-features-pill"]') ||
                wheelTarget?.closest('[data-testid="smart-features-panel"]')
              ) {
                return;
              }
              if (event.deltaY > 12 && !shelfOpen) {
                setCastOpen(false);
                setSmartOpen(false);
                setShelfOpen(true);
                reveal();
              } else if (event.deltaY < -12 && shelfOpen) {
                const shelfEl = stageRef.current?.querySelector<HTMLElement>('[data-testid="tv-player-shelf"]');
                if (!shelfEl || shelfEl.scrollTop <= 0) {
                  setShelfOpen(false);
                  reveal();
                }
              }
            }}
          >
            <video ref={attachVideo} src={hlsSource ? undefined : source} playsInline preload="auto" data-nova-player className="absolute inset-0 h-full w-full object-contain" />
            <Button variant="novaAction" aria-label="Show video controls" onClick={reveal} className="absolute inset-0 h-full w-full rounded-none p-0 hover:bg-transparent" />
            {!ready && !error && <LoaderCircle aria-label="Loading video" className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin text-nova-accent motion-reduce:animate-none" />}
            {tv && locked ? (
              <div aria-hidden={!controls} inert={!controls} className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-end p-2 sm:p-4 transition-opacity duration-200 motion-reduce:transition-none ${controls ? 'opacity-100' : 'opacity-0'}`}>
                <Button
                  variant="novaPlayer"
                  size="icon"
                  aria-label="Unlock screen"
                  title="Unlock screen"
                  onClick={() => { setLocked(false); reveal(); }}
                  className="pointer-events-auto h-9 w-9 [&_svg]:size-5"
                >
                  <Lock />
                </Button>
              </div>
            ) : (
              <div aria-hidden={!controls} inert={!controls} className={`nova-player-shade pointer-events-none absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none ${controls ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between gap-1 p-2 sm:p-4 ${tv ? 'bg-gradient-to-b from-nova-black/90 to-transparent px-8 pb-16 pt-6' : ''}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Button variant="novaPlayer" size="icon" aria-label="Close player" title="Back" onClick={onClose} className="h-9 w-9 shrink-0 [&_svg]:size-5"><ArrowLeft /></Button>
                    {tv && <div className="min-w-0">
                      <p data-testid="tv-player-title" className="truncate text-2xl font-extrabold tracking-tight text-nova-text drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] lg:text-3xl">{title}</p>
                    </div>}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {!tv && (
                      <Button
                        variant="novaPlayer"
                        size="icon"
                        aria-label={casting ? 'Stop casting' : 'Cast video'}
                        title={casting ? 'Casting' : 'Cast'}
                        aria-pressed={casting}
                        aria-expanded={castOpen}
                        onClick={() => { setSmartOpen(false); handleCast(); }}
                        className={`h-9 w-9 [&_svg]:size-5 ${casting ? 'text-nova-accent' : ''}`}
                      >
                        <Cast />
                      </Button>
                    )}
                    {tv && (
                      <Button
                        variant="novaPlayer"
                        size="icon"
                        aria-label="Lock screen"
                        title="Lock screen"
                        onClick={() => { setSettings(false); setShelfOpen(false); setCastOpen(false); setSmartOpen(false); setLocked(true); reveal(); }}
                        className="h-9 w-9 [&_svg]:size-5"
                      >
                        <LockOpen />
                      </Button>
                    )}
                    {!tv && <Button variant="novaPlayer" size="icon" aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title="Fullscreen" onClick={toggleFullscreen} className="h-9 w-9 [&_svg]:size-5">{fullscreen ? <Minimize /> : <Maximize />}</Button>}
                    <Button variant="novaPlayer" size="icon" aria-label="Player settings" title="Settings" aria-expanded={settings} onClick={() => { setCastOpen(false); setSmartOpen(false); setShelfOpen(false); setSettingsTab('Quality'); setSettings(!settings); reveal(); }} className="h-9 w-9 [&_svg]:size-5"><Settings /></Button>
                  </div>
                </div>
                {ready && !settings && !shelfOpen && !smartOpen && <div className="pointer-events-auto absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6 sm:gap-14">
                  <Button variant="novaPlayer" aria-label="Rewind 10 seconds" title="Rewind 10 seconds" onClick={() => seek((ref.current?.currentTime ?? 0) - 10)} className="nova-pill h-11 gap-0.5 rounded-full border border-white/15 bg-[#0f1219]/[0.92] px-3 text-xs font-bold [&_svg]:size-4"><ChevronsLeft strokeWidth={2.4} /><span>10s</span></Button>
                  <Button variant="novaPlayer" aria-label={playing ? 'Pause video' : 'Play video'} title={playing ? 'Pause' : 'Play'} onClick={togglePlay} className="h-12 w-12 rounded-full bg-transparent sm:h-16 sm:w-16 [&_svg]:size-7 sm:[&_svg]:size-9">{playing ? <Pause className="fill-nova-text" /> : <Play className="fill-nova-text" />}</Button>
                  <Button variant="novaPlayer" aria-label="Forward 10 seconds" title="Forward 10 seconds" onClick={() => seek((ref.current?.currentTime ?? 0) + 10)} className="nova-pill h-11 gap-0.5 rounded-full border border-white/15 bg-[#0f1219]/[0.92] px-3 text-xs font-bold [&_svg]:size-4"><span>10s</span><ChevronsRight strokeWidth={2.4} /></Button>
                </div>}
                {!settings && !shelfOpen && !smartOpen && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-2 sm:px-5 sm:pb-4">
                  <div className="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[10px] font-medium tabular-nums text-nova-text sm:text-xs">
                    <span>{clock(time)} <span className="text-nova-muted">/ {clock(duration)}</span></span>
                    <span />
                    <span />
                  </div>
                  <input type="range" aria-label="Video progress" min={0} max={duration || 1} step={0.1} value={time} disabled={!ready} onChange={event => seek(Number(event.target.value))} style={{ '--nova-progress': `${duration ? (time / duration) * 100 : 0}%` } as React.CSSProperties} className="nova-player-range pointer-events-auto block h-4 w-full" />
                </div>}
              </div>
            )}
            {smartPillVisible && !locked && !settings && !shelfOpen && !smartOpen && (
              <div className="pointer-events-none absolute inset-x-0 bottom-9 z-[124] flex justify-end px-3 sm:bottom-11 sm:px-5">
                <button
                  type="button"
                  data-testid="smart-features-pill"
                  aria-label="Smart Features"
                  aria-expanded={smartOpen}
                  onKeyDown={event => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }}
                  onClick={event => {
                    event.stopPropagation();
                    setCastOpen(false);
                    setSettings(false);
                    setShelfOpen(false);
                    setSmartOpen((prev) => !prev);
                    reveal();
                  }}
                  className={`nova-smart-pill pointer-events-auto relative inline-flex cursor-pointer rounded-full ${
                    tv ? '' : 'transition-transform hover:scale-105 active:scale-95'
                  }`}
                >
                  {tv ? (
                    <span className="inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-transparent px-4 text-xs font-bold leading-none tracking-wide text-white/95 sm:h-10 sm:text-sm">
                      <span>Smart</span>{' '}
                      <span>Features</span>
                    </span>
                  ) : (
                    <span className="nova-smart-pill-inner inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-transparent text-xs font-bold leading-none tracking-wide text-white/95 sm:h-10 sm:min-w-10 sm:text-sm">
                      <span className="nova-smart-text-window gap-1">
                        <span className="nova-smart-word-1">Smart</span>{' '}
                        <span className="nova-smart-word-2">Features</span>
                      </span>
                    </span>
                  )}
                </button>
              </div>
            )}
            {tv && langStripVisible && !locked && !settings && !shelfOpen && !smartOpen && (
              // Stays just above the timeline for the full 2 minutes, even while the other controls fade out.
              <div data-testid="tv-language-strip" className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-6 sm:bottom-12">
                <LanguageStrip rows={languageRows} selected={audioLang} onSelect={selectAudioLanguage} onMore={openLanguageSettings} />
              </div>
            )}
            {castOpen && !locked && !tv && (
              <div
                role="dialog"
                aria-label="Cast to device"
                className="pointer-events-auto absolute right-4 top-16 z-[124] w-72 rounded-xl border border-nova-line bg-[#0f1219]/[0.92] p-4 text-left shadow-2xl sm:right-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Cast className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                    <span>Cast Video</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Close cast panel"
                    onClick={() => setCastOpen(false)}
                    className="grid h-7 w-7 place-items-center rounded-full text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/95">{castMessage}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void triggerBrowserCast()}
                    className="flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    Search Devices
                  </button>
                  {casting && (
                    <button
                      type="button"
                      onClick={() => { setCasting(false); setCastOpen(false); }}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            )}
            {smartOpen && !locked && (
              <SmartFeaturesOverlay
                roomId={coWatchSync.roomId}
                companionUrl={coWatchSync.companionUrl}
                onEnsureHostRoom={ensureHostRoom}
                onClose={() => { setSmartOpen(false); reveal(); }}
              />
            )}
            {tv && shelfOpen && !locked && !settings && (
              <RelatedShows
                variant="shelf"
                title={title}
                contentType={contentType}
                onPlay={onSelect}
                onClose={() => { setShelfOpen(false); reveal(); }}
              />
            )}
            {settings && !locked && (
              <SettingsSheet
                tv={tv}
                initialTab={settingsTab}
                onClose={() => setSettings(false)}
                audioLang={audioLang}
                setAudioLang={selectAudioLanguage}
                subtitle={subtitle}
                setSubtitle={selectSubtitleLanguage}
                subtitleOptions={subtitleOptions}
                speed={speed}
                setSpeed={(n: number) => { if (ref.current) ref.current.playbackRate = n; setSpeed(n); }}
              />
            )}
            {error && <div role="alert" className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 text-center text-xs text-nova-text">
              <p>{error}</p><Button variant="novaPlayer" size="sm" onClick={() => { setError(''); ref.current?.load(); }}>Try again</Button>
            </div>}
          </div>
          {!tv && langStripVisible && (
            <div className="px-3 pt-5 sm:px-5">
              <LanguageStrip rows={languageRows} selected={audioLang} onSelect={selectAudioLanguage} onMore={openLanguageSettings} />
            </div>
          )}
          {!tv && <PlayerActions title={title} source={source} />}
          {!tv && <RelatedShows title={title} contentType={contentType} onPlay={onSelect} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function ResumePlayer({
  title,
  onClose,
  src,
  contentType,
}: {
  title: string;
  onClose: () => void;
  src?: string | undefined;
  contentType?: 'movie' | 'series' | 'video' | undefined;
}) {
  const [selected, setSelected] = useState(title);
  useEffect(() => setSelected(title), [title]);
  return (
    <PlayerScreen
      key={selected}
      title={selected}
      onClose={onClose}
      onSelect={setSelected}
      src={selected === title ? src : undefined}
      contentType={selected === title ? contentType : undefined}
    />
  );
}

type Opt = { label: string; hint?: string; badge?: string; value: string };
const QUALITY: Opt[] = [
  { label: 'Auto', hint: 'Best experience', value: 'auto' },
  { label: 'Full HD', hint: 'Up to 1080p', value: '1080' },
  { label: 'HD', hint: 'Up to 720p', value: '720' },
  { label: 'Data Saver', value: 'saver' },
];

const ISSUES = [
  { Icon: Wifi, title: 'Buffering and Connection Issues', desc: "Frequent buffering, playback won't start, or similar problems" },
  { Icon: MonitorPlay, title: 'Video Quality', desc: 'Video is blurry, cuts out, or looks strange in some way' },
  { Icon: Volume2, title: 'Audio Quality', desc: 'Audio is hard to hear, mismatched with video, or missing in certain parts' },
  { Icon: MessageSquareText, title: 'Subtitles and Captions', desc: 'Missing, hard to read, mismatched with audio, misspelt or poor translation' },
];

/** How long the language rows stay on the watch screen after a video opens. */
export const LANGUAGE_STRIP_MS = 2 * 60 * 1000;
/** How long the language rows stay visible after a viewer picks a language. */
export const LANGUAGE_STRIP_SELECT_MS = 60 * 1000;
/** How long the Smart Features pill stays visible before automatically hiding (5 minutes). */
export const SMART_FEATURES_VISIBLE_MS = 5 * 60 * 1000;
const STRIP_TOP = ['English', 'Hindi', 'Tamil', 'Telugu'] as const;
const STRIP_BOTTOM = ['Kannada'] as const;

/** Two rows: four languages on top, one plus More below. A picked language not shown replaces the bottom slot. */
export function getLanguageStripRows(selected: string): [string[], string[]] {
  const top: string[] = [...STRIP_TOP];
  const bottom: string[] = [...STRIP_BOTTOM];
  if (selected && !top.includes(selected) && !bottom.includes(selected)) bottom[0] = selected;
  return [top, bottom];
}

function LanguagePill({ lang, active, onClick }: { lang: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 w-full min-w-0 items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-white transition-all sm:text-xs ${
        active ? 'nova-lang-pill-active' : 'nova-lang-pill-idle hover:brightness-125'
      }`}
    >
      <span className="truncate">{lang}</span>
      {active && <Check className="h-3 w-3 shrink-0" strokeWidth={3} />}
    </button>
  );
}

function LanguageStrip({ rows, selected, onSelect, onMore }: { rows: [string[], string[]]; selected: string; onSelect: (lang: string) => void; onMore: () => void }) {
  const [top, bottom] = rows;
  return (
    <div role="group" aria-label="Choose language" data-testid="language-strip" className="pointer-events-auto mx-auto w-full max-w-[460px] space-y-2 animate-in fade-in duration-300">
      <div data-testid="lang-row-top" className="grid grid-cols-4 gap-2">
        {top.map(lang => <LanguagePill key={lang} lang={lang} active={selected === lang} onClick={() => onSelect(lang)} />)}
      </div>
      <div data-testid="lang-row-bottom" className="grid grid-cols-4 gap-2">
        <div className="col-start-2 w-full">
          <LanguagePill lang={bottom[0] ?? 'Kannada'} active={selected === bottom[0]} onClick={() => onSelect(bottom[0] ?? 'Kannada')} />
        </div>
        <button
          type="button"
          aria-label="More Languages"
          onClick={onMore}
          className="nova-lang-pill-idle inline-flex h-8 w-full min-w-0 items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-white transition-all hover:brightness-125 sm:text-xs"
        >
          <MoreHorizontal className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span className="truncate">More</span>
        </button>
      </div>
    </div>
  );
}

const ALL_AUDIO_LANGUAGES: Opt[] = [
  { label: 'Hindi', hint: 'Original', value: 'Hindi' },
  ...APP_LANGUAGES.filter((l) => l.id !== 'Hindi').map((l) => ({
    label: l.id,
    ...(l.script !== l.id ? { hint: l.script } : {}),
    value: l.id,
  })),
];

type SettingsTab = 'Quality' | 'Audio Language' | 'Subtitles' | 'Speed';

function SettingsSheet({
  tv,
  initialTab = 'Quality',
  onClose,
  audioLang,
  setAudioLang,
  subtitle,
  setSubtitle,
  subtitleOptions,
  speed,
  setSpeed,
}: {
  tv: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
  audioLang: string;
  setAudioLang: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  subtitleOptions: Opt[];
  speed: number;
  setSpeed: (n: number) => void;
}) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [quality, setQuality] = useState('auto');
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const lists: Record<string, { opts: Opt[]; value: string; set: (v: string) => void }> = {
    Quality: { opts: QUALITY, value: quality, set: setQuality },
    'Audio Language': { opts: ALL_AUDIO_LANGUAGES, value: audioLang, set: setAudioLang },
    Subtitles: { opts: subtitleOptions.map(o => ({ ...o, ...(o.value !== 'Off' ? { badge: '[CC]' } : {}) })), value: subtitle, set: setSubtitle },
    Speed: { opts: [0.5, 0.75, 1, 1.25, 1.5, 2].map(n => ({ label: n === 1 ? '1× Normal' : `${n}×`, value: String(n) })), value: String(speed), set: v => setSpeed(Number(v)) },
  };
  const current = lists[tab]!;
  const backdropClass = tv
    ? 'fixed inset-0 z-[125] flex justify-end bg-[#0f1219]/[0.92]'
    : 'fixed inset-0 z-[125] flex items-end bg-[#0f1219]/[0.92]';
  const panelClass = tv
    ? 'nova-video-settings-bg flex h-full w-full max-w-md flex-col border-l border-[#ec4899]/30 px-6 pb-8 pt-6 shadow-2xl animate-in slide-in-from-right duration-200'
    : 'nova-video-settings-bg w-full rounded-t-2xl border-t border-[#ec4899]/30 px-5 pb-8 pt-6 shadow-2xl sm:mx-auto sm:max-w-xl';

  if (reporting) return (
    <div className={backdropClass} onClick={onClose}>
      <div role="group" aria-label="Report a problem" data-side={tv ? 'right' : 'bottom'} onClick={e => e.stopPropagation()} className={panelClass}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Back to settings" onClick={() => setReporting(false)} className="text-nova-text"><ArrowLeft className="h-6 w-6" /></button>
            <p className="text-xl font-semibold text-nova-text">Report a Problem</p>
          </div>
          {tv && (
            <button type="button" aria-label="Close settings" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-nova-muted hover:bg-white/10 hover:text-nova-text">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {reported ? <p role="status" className="py-8 text-center text-sm text-nova-text">Thanks! Your report has been noted.</p> : (
          <ul className="space-y-5 overflow-y-auto">
            {ISSUES.map(({ Icon, title, desc }) => (
              <li key={title}><button type="button" onClick={() => { setReported(true); window.setTimeout(onClose, 1500); }} className="flex w-full items-start gap-4 text-left">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-nova-text" />
                <span><span className="block text-base font-semibold text-nova-text">{title}</span><span className="mt-1 block text-sm text-nova-muted">{desc}</span></span>
              </button></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
  return (
    <div className={backdropClass} onClick={onClose}>
      <div role="group" aria-label="Playback settings" data-side={tv ? 'right' : 'bottom'} onClick={e => e.stopPropagation()} className={panelClass}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-xl font-semibold text-nova-text">Settings</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setReporting(true)} className="text-sm font-medium text-nova-muted hover:text-nova-text">Report a Problem</button>
            {tv && (
              <button type="button" aria-label="Close settings" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-nova-muted hover:bg-white/10 hover:text-nova-text">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div role="tablist" className={`mb-4 flex gap-5 overflow-x-auto border-b border-nova-text/10 ${tv ? 'scrollbar-hide' : ''}`}>
          {(Object.keys(lists) as (typeof tab)[]).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${tab === t ? 'border-nova-text text-nova-text' : 'border-transparent text-nova-muted hover:text-nova-text'}`}>{t}</button>
          ))}
        </div>
        <ul className={`space-y-1 overflow-y-auto ${tv ? 'scrollbar-hide flex-1' : 'max-h-[52dvh] min-h-48 pr-1'}`}>
          {current.opts.map(o => {
            const active = current.value === o.value;
            return <li key={o.value}><button type="button" aria-pressed={active} onClick={() => current.set(o.value)} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors ${tv ? 'hover:bg-white/5' : ''}`}>
              <span className="w-5">{active && <Check className="h-4 w-4 text-nova-accent" />}</span>
              <span className={active ? 'font-semibold text-nova-text' : 'text-nova-muted'}>{o.label}</span>
              {o.hint && <span className={active ? 'text-nova-text' : 'text-nova-muted'}>{o.hint}</span>}
              {o.badge && <span className="text-[11px] font-bold tracking-widest text-nova-rating">{o.badge}</span>}
            </button></li>;
          })}
        </ul>
      </div>
    </div>
  );
}
