// Browser-safe helpers for search, mood picks and device info.
export const TITLE_GENRES: Record<string, string[]> = {
  'Neon Dreams': ['Sci-Fi', 'Mystery'],
  'Shadow Protocol': ['Action', 'Thriller'],
  'Crimson Veil': ['Thriller', 'Crime'],
  'Barcode': ['Mystery', 'Drama'],
  'Saruam Maya': ['Drama', 'Romance'],
  'Spectra': ['Drama'],
  'The Silent Witness': ['Crime'],
  'Midnight Hollow': ['Horror', 'Mystery'],
  'Foggy Crossing': ['Mystery', 'Thriller'],
  'Echoes of Tomorrow': ['Sci-Fi'],
  'Last Horizon': ['Sci-Fi', 'Action'],
  'Black Mirror City': ['Sci-Fi', 'Mystery'],
  'The Order': ['Mystery'],
  'Rogue State': ['Action', 'Thriller'],
  'Dark Matter': ['Sci-Fi', 'Mystery'],
  'Midnight Run': ['Action', 'Comedy'],
  'Zero Hour': ['Thriller'],
};

export const ALL_TITLES = Object.keys(TITLE_GENRES);

const MOOD_WORDS: Record<string, string[]> = {
  Action: ['action', 'fight', 'thrill', 'josh', 'excit', 'adventure', 'fast'],
  Thriller: ['thrill', 'suspense', 'tense', 'edge', 'dark'],
  Comedy: ['comedy', 'funny', 'laugh', 'light', 'hasna', 'mazak', 'happy', 'fun'],
  Romance: ['love', 'romance', 'romantic', 'pyar', 'date'],
  Drama: ['drama', 'emotional', 'sad', 'family', 'cry', 'feel'],
  Horror: ['horror', 'scary', 'dar', 'ghost', 'bhoot'],
  'Sci-Fi': ['sci', 'future', 'space', 'tech', 'robot'],
  Mystery: ['mystery', 'puzzle', 'twist', 'secret'],
  Crime: ['crime', 'police', 'detective', 'murder'],
};

export function searchTitles(query: string, extra: string[] = []): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = Array.from(new Set([...extra, ...ALL_TITLES]));
  return pool.filter((t) => t.toLowerCase().includes(q) || (TITLE_GENRES[t] ?? []).some((g) => g.toLowerCase().includes(q)));
}

export function titlesByGenre(genre: string): string[] {
  return ALL_TITLES.filter((t) => TITLE_GENRES[t]?.includes(genre));
}

export function moodPicks(mood: string): { title: string; why: string }[] {
  const m = mood.toLowerCase();
  const genres = Object.entries(MOOD_WORDS).filter(([, words]) => words.some((w) => m.includes(w))).map(([g]) => g);
  const wanted = genres.length ? genres : ['Drama', 'Thriller'];
  return ALL_TITLES
    .map((t) => ({ t, hits: (TITLE_GENRES[t] ?? []).filter((g) => wanted.includes(g)) }))
    .filter((x) => x.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, 6)
    .map(({ t, hits }) => ({ title: t, why: `${hits.join(' & ')} pick for your mood.` }));
}

export function deviceLabel(ua: string): string {
  const s = ua.toLowerCase();
  const tablet = /ipad|tablet/.test(s) || (/android/.test(s) && !/mobile/.test(s));
  let os = 'Device';
  if (/android/.test(s)) os = 'Android';
  else if (/iphone|ipad|ipod/.test(s)) os = 'iOS';
  else if (/windows/.test(s)) os = 'Windows';
  else if (/mac os/.test(s)) os = 'Mac';
  else if (/linux/.test(s)) os = 'Linux';
  let browser = '';
  if (/edg\//.test(s)) browser = 'Edge';
  else if (/chrome\//.test(s)) browser = 'Chrome';
  else if (/firefox\//.test(s)) browser = 'Firefox';
  else if (/safari\//.test(s)) browser = 'Safari';
  const kind = /mobile|iphone/.test(s) ? 'Phone' : tablet ? 'Tablet' : 'Computer';
  return `${os} ${kind}${browser ? ` · ${browser}` : ''}`;
}
