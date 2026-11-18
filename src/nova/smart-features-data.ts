import actorKabir from '@/assets/images/actor_kabir_portrait_1794926797890.webp';
import actorMeera from '@/assets/images/actor_meera_portrait_1794926798621.webp';
import actorVikram from '@/assets/images/actor_vikram_portrait_1794926798961.webp';
import actorAnanya from '@/assets/images/actor_ananya_portrait_1794926799773.webp';

/* ---------- Family Safe Mode Metadata ---------- */

export const PROFANITY_WORD_LIST = [
  'damn',
  'hell',
  'bastard',
  'bitch',
  'shit',
  'fuck',
  'asshole',
  'crap',
  'bloody',
  'bullshit',
] as const;

const PROFANITY_REGEX = new RegExp(`\\b(${PROFANITY_WORD_LIST.join('|')})\\b`, 'i');

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  return PROFANITY_REGEX.test(text);
}

export type ProfanityInterval = {
  id: string;
  start: number;
  end: number;
  phrase: string;
};

export type MatureSceneInterval = {
  id: string;
  start: number;
  end: number;
  label: string;
};

export const SAMPLE_PROFANITY_TIMESTAMPS: ProfanityInterval[] = [
  { id: 'prof-1', start: 4, end: 7, phrase: 'Explicit dialogue' },
  { id: 'prof-2', start: 18, end: 21, phrase: 'Restricted dialogue' },
  { id: 'prof-3', start: 42, end: 46, phrase: 'Strong language' },
  { id: 'prof-4', start: 105, end: 109, phrase: 'Explicit dialogue' },
  { id: 'prof-5', start: 260, end: 264, phrase: 'Restricted dialogue' },
];

export const SAMPLE_MATURE_SCENES: MatureSceneInterval[] = [
  { id: 'mat-1', start: 12, end: 16, label: 'Intense action' },
  { id: 'mat-2', start: 120, end: 145, label: 'Mature content' },
  { id: 'mat-3', start: 340, end: 375, label: 'Mature sequence' },
];

export function formatTimestamp(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/* ---------- Scene Info (X-Ray) 10-Minute Clip Metadata ---------- */

export type SceneActor = {
  id: string;
  name: string;
  character: string;
  avatar: string;
  initials: string;
};

export type SceneMusic = {
  playing: boolean;
  title: string;
  artist: string;
};

export type SceneMetadataEntry = {
  id: string;
  start: number;
  end: number;
  sceneTitle: string;
  location: string;
  actors: SceneActor[];
  music: SceneMusic | null;
};

const ACTORS = {
  kabir: {
    id: 'actor-kabir',
    name: 'Kabir Malhotra',
    character: 'Agent Arjun',
    avatar: actorKabir,
    initials: 'KM',
  },
  meera: {
    id: 'actor-meera',
    name: 'Meera Sen',
    character: 'Maya Rao',
    avatar: actorMeera,
    initials: 'MS',
  },
  vikram: {
    id: 'actor-vikram',
    name: 'Vikram Verma',
    character: 'Director Rathore',
    avatar: actorVikram,
    initials: 'VV',
  },
  ananya: {
    id: 'actor-ananya',
    name: 'Ananya Kapoor',
    character: 'Tara Nair',
    avatar: actorAnanya,
    initials: 'AK',
  },
} satisfies Record<string, SceneActor>;

/** Realistic 10-minute (0s - 600s) scene metadata timeline for live X-Ray sync. */
export const SAMPLE_SCENE_TIMELINE: SceneMetadataEntry[] = [
  {
    id: 'scene-01',
    start: 0,
    end: 15,
    sceneTitle: 'Opening Skyline Arrival',
    location: 'Marine Drive Helipad',
    actors: [ACTORS.kabir, ACTORS.meera],
    music: {
      playing: true,
      title: 'Midnight Pulse',
      artist: 'Anirudh & Arijit',
    },
  },
  {
    id: 'scene-02',
    start: 15,
    end: 45,
    sceneTitle: 'Encrypted Briefing Room',
    location: 'Sector 7 Command',
    actors: [ACTORS.vikram, ACTORS.kabir, ACTORS.ananya],
    music: {
      playing: true,
      title: 'Cipher Horizon',
      artist: 'Nikhita Gandhi',
    },
  },
  {
    id: 'scene-03',
    start: 45,
    end: 120,
    sceneTitle: 'Dockyard Surveillance',
    location: 'Pier 14 Container Yard',
    actors: [ACTORS.kabir, ACTORS.ananya],
    music: {
      playing: false,
      title: 'Ambient Silence',
      artist: 'Live Dialogue Scene',
    },
  },
  {
    id: 'scene-04',
    start: 120,
    end: 210,
    sceneTitle: 'The Vault Breach',
    location: 'Sub-Level Treasury',
    actors: [ACTORS.meera, ACTORS.vikram],
    music: {
      playing: true,
      title: 'Shadow Protocol Theme',
      artist: 'Rohan Vinayak',
    },
  },
  {
    id: 'scene-05',
    start: 210,
    end: 315,
    sceneTitle: 'Rooftop Confrontation',
    location: 'Bandra Glass Tower',
    actors: [ACTORS.kabir, ACTORS.vikram],
    music: {
      playing: true,
      title: 'Iron Echoes',
      artist: 'Amit Trivedi',
    },
  },
  {
    id: 'scene-06',
    start: 315,
    end: 420,
    sceneTitle: 'Safe House Decryption',
    location: 'Colaba Loft',
    actors: [ACTORS.meera, ACTORS.ananya],
    music: {
      playing: false,
      title: 'No Background Score',
      artist: 'Quiet Interrogation',
    },
  },
  {
    id: 'scene-07',
    start: 420,
    end: 510,
    sceneTitle: 'Metro Tunnel Pursuit',
    location: 'Line 3 Underground',
    actors: [ACTORS.kabir, ACTORS.meera, ACTORS.ananya],
    music: {
      playing: true,
      title: 'Velocity 99',
      artist: 'Ritviz & Nucleya',
    },
  },
  {
    id: 'scene-08',
    start: 510,
    end: 600,
    sceneTitle: 'Harbour Dawn Standoff',
    location: 'Gateway Wharf',
    actors: [ACTORS.kabir, ACTORS.meera, ACTORS.vikram, ACTORS.ananya],
    music: {
      playing: true,
      title: 'Dawn Over Harbour',
      artist: 'Prateek Kuhad',
    },
  },
];

export function getActiveSceneForTime(
  currentTime: number,
  timeline: SceneMetadataEntry[] = SAMPLE_SCENE_TIMELINE,
): SceneMetadataEntry {
  if (timeline.length === 0) {
    throw new Error('Scene timeline is empty');
  }
  const safeTime = Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;
  const maxEnd = timeline[timeline.length - 1]!.end || 600;
  const normalized = safeTime >= maxEnd ? safeTime % maxEnd : safeTime;
  return (
    timeline.find(entry => normalized >= entry.start && normalized < entry.end) ??
    timeline[0]!
  );
}
