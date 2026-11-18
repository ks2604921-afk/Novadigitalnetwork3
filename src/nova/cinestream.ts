export const CINESTREAM_BASE_URL = 'https://ais-dev-ktkzzhbnmvjnxrwt6nbs3t-620647251792.asia-southeast1.run.app/api/v1';
export const CATALOG_REFRESH_MS = 15_000;

export type CmsEpisode = { id: string; title: string; description: string; artwork: string; number: number };
export type CmsSeason = { id: string; title: string; number: number; episodes: CmsEpisode[] };
export type CmsShow = { id: string; title: string; description: string; artwork: string; banner: string; category: string; languages: string[]; year: string; seasons: CmsSeason[] };
export type CmsBanner = { id: string; title: string; artwork: string; showId: string };
export type CmsCatalog = { shows: CmsShow[]; banners: CmsBanner[] };
export type CmsResult<T> = { data: T; error: string | null };

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const list = (value: unknown): Row[] => Array.isArray(value) ? value.map(row) : [];
const text = (...values: unknown[]): string => {
  const found = values.find(value => (typeof value === 'string' && value.trim()) || typeof value === 'number');
  return found === undefined ? '' : String(found);
};
const id = (value: Row) => text(value['id'], value['_id']);
const number = (value: unknown, fallback: number) => Number(value) || fallback;
export function mediaUrl(value: unknown): string {
  const source = typeof value === 'string' ? value : text(row(value)['url'], row(value)['src']);
  if (!source) return '';
  try {
    const url = new URL(source, CINESTREAM_BASE_URL + '/');
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}
const artwork = (value: Row) => mediaUrl(value['posterUrl'] ?? value['thumbnailUrl'] ?? value['imageUrl'] ?? value['artwork'] ?? value['poster'] ?? value['thumbnail']);
const linked = (value: Row, field: string) => text(value[field], row(value[field.replace('Id', '')])['id']);

function episode(value: Row, index: number): CmsEpisode {
  return { id: id(value), title: text(value['title'], value['name'], `Episode ${index + 1}`), description: text(value['description'], value['synopsis']), artwork: artwork(value), number: number(value['episodeNumber'] ?? value['number'], index + 1) };
}

// Supports nested seasons/episodes and flat collections linked by showId/seasonId.
// Keep this adapter separate so the CMS response contract can be refined without changing the UI.
export function normalizeCatalog(input: unknown): CmsCatalog {
  const outer = row(input);
  const data = row(outer['data'] ?? outer['catalog'] ?? input);
  const rawShows = list(data['shows'] ?? data['series']);
  if (!Array.isArray(data['shows']) && !Array.isArray(data['series'])) throw new Error('Catalog response is missing shows.');
  const seasons = list(data['seasons']);
  const episodes = list(data['episodes']);
  const shows = rawShows.filter(value => id(value)).map((value): CmsShow => {
    const showId = id(value);
    const ownSeasons = Array.isArray(value['seasons']) ? list(value['seasons']) : seasons.filter(season => linked(season, 'showId') === showId);
    const mappedSeasons = ownSeasons.map((season, index): CmsSeason => ({
      id: id(season) || `${showId}-season-${index + 1}`,
      title: text(season['title'], season['name'], `Season ${index + 1}`),
      number: number(season['seasonNumber'] ?? season['number'], index + 1),
      episodes: (Array.isArray(season['episodes']) ? list(season['episodes']) : episodes.filter(item => linked(item, 'seasonId') === id(season)))
        .map(episode).filter(item => item['id']).sort((a, b) => a['number'] - b['number']),
    })).sort((a, b) => a['number'] - b['number']);
    if (!mappedSeasons.length && Array.isArray(value['episodes'])) mappedSeasons.push({ id: `${showId}-episodes`, title: 'Episodes', number: 1, episodes: list(value['episodes']).map(episode).filter(item => item['id']) });
    const languageValues = value['languages'] ?? value['availableLanguages'] ?? value['language'];
    const languages = Array.isArray(languageValues) ? languageValues.map(item => text(item, row(item)['name'])).filter(Boolean) : typeof languageValues === 'string' ? languageValues.split(',').map(item => item.trim()).filter(Boolean) : [];
    return { id: showId, title: text(value['title'], value['name']), description: text(value['description'], value['synopsis']), artwork: artwork(value), banner: mediaUrl(value['bannerUrl'] ?? value['backdropUrl'] ?? value['heroImageUrl']) || artwork(value), category: text(value['category'], row(value['category'])['name'], value['genre'], 'Shows'), languages, year: text(value['releaseYear'], value['year']), seasons: mappedSeasons };
  });
  const banners = list(data['featuredBanners'] ?? data['heroBanners'] ?? data['banners'] ?? data['featured']).map((value): CmsBanner => {
    const showId = text(value['showId'], row(value['show'])['id'], value['contentId'], id(value));
    const show = shows.find(item => item['id'] === showId);
    return { id: id(value) || showId, showId, title: text(value['title'], show?.title), artwork: mediaUrl(value['imageUrl'] ?? value['bannerUrl'] ?? value['backdropUrl'] ?? value['artwork']) || show?.banner || '' };
  });
  return { shows, banners: banners.length ? banners : shows.map(show => ({ id: show['id'], showId: show['id'], title: show['title'], artwork: show.banner })) };
}

export function normalizeManifest(input: unknown): { streamUrl: string } {
  const outer = row(input);
  const data = row(outer['data'] ?? input);
  const source = row(data['episode'] ?? data);
  const streamUrl = mediaUrl(row(source['playbackManifest'])['streamUrl']);
  if (!streamUrl) throw new Error('Episode has no supported playbackManifest.streamUrl.');
  return { streamUrl };
}