import { afterEach, describe, it, expect, vi } from 'vitest';
import { readCatalog, readEpisode } from '@/lib/cinestream.server';

afterEach(() => vi.unstubAllGlobals());
describe('CineStream external reads', () => {
  it('requests a fresh catalog without browser CORS or redirecting to login', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ shows: [] }), { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    expect((await readCatalog()).error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/catalog'), expect.objectContaining({ cache: 'no-store', redirect: 'manual' }));
  });
  it('reports restricted API access without pretending the catalog is connected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 302 })));
    const result = await readCatalog();
    expect(result.data.shows).toEqual([]);
    expect(result.error).toContain('public JSON API');
  });
  it('fetches the clicked episode ID and returns its manifest stream', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ playbackManifest: { streamUrl: 'https://example.com/real.mp4' } }), { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    expect((await readEpisode('ep-123')).data?.streamUrl).toBe('https://example.com/real.mp4');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/episodes/ep-123'), expect.anything());
  });
});