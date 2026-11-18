import type Hls from 'hls.js';
import type { MediaPlaylist } from 'hls.js';
import { APP_LANGUAGES } from '@/nova/languages';

export type TrackOption = {
  value: string;
  label: string;
  hint?: string;
  trackId?: number;
};

type NativeAudioTrack = {
  id?: string;
  language?: string;
  label?: string;
  enabled: boolean;
};

type VideoWithNativeTracks = HTMLVideoElement & {
  audioTracks?: ArrayLike<NativeAudioTrack>;
};

const LANGUAGE_ALIASES: Record<string, string[]> = {
  Hindi: ['hi', 'hin', 'hindi', 'हिन्दी'],
  English: ['en', 'eng', 'english'],
  Tamil: ['ta', 'tam', 'tamil', 'தமிழ்'],
  Telugu: ['te', 'tel', 'telugu', 'తెలుగు'],
  Bengali: ['bn', 'ben', 'bengali', 'bangla', 'বাংলা'],
  Malayalam: ['ml', 'mal', 'malayalam', 'മലയാളം'],
  Kannada: ['kn', 'kan', 'kannada', 'ಕನ್ನಡ'],
  Marathi: ['mr', 'mar', 'marathi', 'मराठी'],
  Gujarati: ['gu', 'guj', 'gujarati', 'ગુજરાતી'],
  Punjabi: ['pa', 'pan', 'punjabi', 'ਪੰਜਾਬੀ'],
  Urdu: ['ur', 'urd', 'urdu', 'اردو'],
  Odia: ['or', 'ori', 'odia', 'oriya'],
  Korean: ['ko', 'kor', 'korean'],
  Japanese: ['ja', 'jpn', 'japanese'],
  Spanish: ['es', 'spa', 'spanish'],
  French: ['fr', 'fra', 'fre', 'french'],
  Arabic: ['ar', 'ara', 'arabic'],
  Chinese: ['zh', 'chi', 'zho', 'chinese'],
};

const CODE_TO_LANGUAGE: Record<string, string> = Object.entries(LANGUAGE_ALIASES).reduce<Record<string, string>>(
  (acc, [name, aliases]) => {
    for (const alias of aliases) {
      acc[alias.toLowerCase()] = name;
    }
    return acc;
  },
  {},
);

export const DEFAULT_AUDIO_LANGUAGE_IDS = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Bengali',
  'Malayalam',
  'Kannada',
  'Marathi',
] as const;

export const DEFAULT_SUBTITLE_IDS = ['Off', 'English', 'Hindi', 'Tamil', 'Telugu'] as const;

export function isHlsSource(src?: string): boolean {
  return Boolean(src && /\.m3u8(\?|$)/i.test(src));
}

export function normalizeTrackLanguage(langCode?: string, name?: string): string {
  const cleanCode = (langCode ?? '').trim().toLowerCase().split(/[-_]/)[0] ?? '';
  if (cleanCode && CODE_TO_LANGUAGE[cleanCode]) {
    return CODE_TO_LANGUAGE[cleanCode];
  }
  const cleanName = (name ?? '').trim().toLowerCase();
  if (cleanName && CODE_TO_LANGUAGE[cleanName]) {
    return CODE_TO_LANGUAGE[cleanName];
  }
  if (name?.trim()) return name.trim();
  if (langCode?.trim()) return langCode.trim().toUpperCase();
  return 'Default';
}

function languageHint(id: string, fallbackHint?: string): string | undefined {
  if (id === 'Off') return 'Subtitles disabled';
  if (id === 'Hindi' && !fallbackHint) return 'Original';
  if (fallbackHint && fallbackHint.toLowerCase() !== id.toLowerCase()) return fallbackHint;
  const match = APP_LANGUAGES.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (match && match.script !== match.id) return match.script;
  return id === 'Hindi' ? 'Original' : undefined;
}

export function matchesLanguageChoice(
  candidate: { lang?: string | undefined; language?: string | undefined; name?: string | undefined; label?: string | undefined },
  choice: string,
): boolean {
  const target = choice.trim().toLowerCase();
  if (!target || target === 'off') return false;
  const aliases = new Set([target, ...(LANGUAGE_ALIASES[choice] ?? [])].map((v) => v.toLowerCase()));
  const fields = [candidate.lang, candidate.language, candidate.name, candidate.label]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => v.trim().toLowerCase());

  return fields.some((field) => {
    if (aliases.has(field)) return true;
    const base = field.split(/[-_]/)[0];
    return Boolean(base && aliases.has(base));
  });
}

export function buildAudioOptions(hlsTracks: MediaPlaylist[], activeAudio: string): TrackOption[] {
  const byValue = new Map<string, TrackOption>();

  for (const track of hlsTracks) {
    const normalized = normalizeTrackLanguage(track.lang, track.name);
    if (!byValue.has(normalized)) {
      const hint = languageHint(normalized, track.name);
      byValue.set(normalized, {
        value: normalized,
        label: normalized,
        ...(hint ? { hint } : {}),
        trackId: track.id,
      });
    }
  }

  for (const id of DEFAULT_AUDIO_LANGUAGE_IDS) {
    if (!byValue.has(id)) {
      const hint = languageHint(id);
      byValue.set(id, {
        value: id,
        label: id,
        ...(hint ? { hint } : {}),
      });
    }
  }

  if (activeAudio && !byValue.has(activeAudio)) {
    const hint = languageHint(activeAudio);
    byValue.set(activeAudio, {
      value: activeAudio,
      label: activeAudio,
      ...(hint ? { hint } : {}),
    });
  }

  return Array.from(byValue.values());
}

export function buildSubtitleOptions(
  hlsTracks: MediaPlaylist[],
  nativeTextTracks: TextTrackList | null | undefined,
  activeSubtitle: string,
): TrackOption[] {
  const byValue = new Map<string, TrackOption>([
    ['Off', { value: 'Off', label: 'Off', hint: 'None' }],
  ]);

  for (const track of hlsTracks) {
    const normalized = normalizeTrackLanguage(track.lang, track.name);
    if (!byValue.has(normalized)) {
      byValue.set(normalized, {
        value: normalized,
        label: normalized,
        hint: track.lang?.toUpperCase() || 'CC',
        trackId: track.id,
      });
    }
  }

  if (nativeTextTracks) {
    for (let i = 0; i < nativeTextTracks.length; i++) {
      const track = nativeTextTracks[i];
      if (!track || (track.kind && track.kind !== 'subtitles' && track.kind !== 'captions')) continue;
      const normalized = normalizeTrackLanguage(track.language, track.label);
      if (!byValue.has(normalized)) {
        byValue.set(normalized, {
          value: normalized,
          label: normalized,
          hint: track.language?.toUpperCase() || 'CC',
        });
      }
    }
  }

  for (const id of DEFAULT_SUBTITLE_IDS) {
    if (!byValue.has(id)) {
      const hint = languageHint(id) ?? 'CC';
      byValue.set(id, {
        value: id,
        label: id,
        hint,
      });
    }
  }

  if (activeSubtitle && !byValue.has(activeSubtitle)) {
    byValue.set(activeSubtitle, {
      value: activeSubtitle,
      label: activeSubtitle,
      hint: 'CC',
    });
  }

  return Array.from(byValue.values());
}

export function switchHlsAudioTrack(
  hls: Hls | null,
  video: HTMLVideoElement | null,
  choice: string,
): number | null {
  let switchedId: number | null = null;

  if (hls && Array.isArray(hls.audioTracks) && hls.audioTracks.length > 0) {
    const matched = hls.audioTracks.find((track) => matchesLanguageChoice(track, choice));
    if (matched) {
      hls.audioTrack = matched.id;
      switchedId = matched.id;
    }
  }

  const nativeTracks = (video as VideoWithNativeTracks | null)?.audioTracks;
  if (nativeTracks && nativeTracks.length > 0) {
    for (let i = 0; i < nativeTracks.length; i++) {
      const track = nativeTracks[i];
      if (!track) continue;
      track.enabled = matchesLanguageChoice(track, choice);
    }
  }

  return switchedId;
}

export function switchHlsSubtitleTrack(
  hls: Hls | null,
  video: HTMLVideoElement | null,
  choice: string,
): number {
  let switchedId = -1;
  const isOff = choice === 'Off';

  if (hls && Array.isArray(hls.subtitleTracks)) {
    if (isOff) {
      hls.subtitleTrack = -1;
      hls.subtitleDisplay = false;
    } else {
      const matched = hls.subtitleTracks.find((track) => matchesLanguageChoice(track, choice));
      if (matched) {
        hls.subtitleTrack = matched.id;
        hls.subtitleDisplay = true;
        switchedId = matched.id;
      }
    }
  }

  const textTracks = video?.textTracks;
  if (textTracks && textTracks.length > 0) {
    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i];
      if (!track) continue;
      track.mode = !isOff && matchesLanguageChoice(track, choice) ? 'showing' : 'disabled';
    }
  }

  return switchedId;
}
