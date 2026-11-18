import { describe, it, expect } from 'vitest';
import { normalizeCatalog, normalizeManifest, CATALOG_REFRESH_MS } from '@/nova/cinestream';

describe('CineStream catalog contract', () => {
  it('connects flat seasons and episodes to the correct show', () => {
    const result = normalizeCatalog({ shows: [{ id: 'a', title: 'Show A' }, { id: 'b', title: 'Show B' }], seasons: [{ id: 's', showId: 'a', seasonNumber: 2 }], episodes: [{ id: 'e2', seasonId: 's', episodeNumber: 2 }, { id: 'e1', seasonId: 's', episodeNumber: 1 }], featuredBanners: [{ id: 'hero', showId: 'a', imageUrl: 'https://example.com/hero.jpg' }] });
    expect(result.shows[0]?.seasons[0]?.episodes.map(item => item.id)).toEqual(['e1', 'e2']);
    expect(result.shows[1]?.seasons).toEqual([]);
    expect(result.banners[0]?.showId).toBe('a');
  });
  it('preserves nested season-wise episodes and CMS language names', () => {
    const result = normalizeCatalog({ data: { shows: [{ id: 'a', title: 'A', languages: ['Hindi', 'Tamil'], seasons: [{ id: 's1', episodes: [{ id: 'e1', title: 'Pilot' }] }, { id: 's2', episodes: [{ id: 'e2' }] }] }] } });
    expect(result.shows[0]?.seasons.map(season => season.episodes.map(item => item.id))).toEqual([['e1'], ['e2']]);
    expect(result.shows[0]?.languages).toEqual(['Hindi', 'Tamil']);
  });
  it('rejects a non-catalog response instead of using sample content', () => {
    expect(() => normalizeCatalog({ message: 'Login required' })).toThrow('missing shows');
  });
  it('uses playbackManifest.streamUrl rather than a sample or unrelated URL', () => {
    expect(normalizeManifest({ data: { playbackManifest: { streamUrl: 'https://example.com/episode.m3u8' }, videoUrl: 'https://example.com/wrong.mp4' } }).streamUrl).toBe('https://example.com/episode.m3u8');
    expect(() => normalizeManifest({ videoUrl: 'https://example.com/wrong.mp4' })).toThrow();
  });
  it('rejects unsafe playback URLs', () => {
    expect(() => normalizeManifest({ playbackManifest: { streamUrl: 'javascript:alert(1)' } })).toThrow();
  });
  it('refreshes catalog every 15 seconds', () => {
    expect(CATALOG_REFRESH_MS).toBe(15000);
  });
});