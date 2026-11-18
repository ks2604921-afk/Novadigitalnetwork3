import { CINESTREAM_BASE_URL, normalizeCatalog, normalizeManifest, type CmsResult, type CmsCatalog } from '@/nova/cinestream';

export async function fetchCmsJson(path: string): Promise<unknown> {
  const response = await fetch(`${CINESTREAM_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status >= 300 && response.status < 400) throw new Error('CineStream requires browser authentication (redirect response).');
  if (!response.ok) throw new Error(`CineStream HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('CineStream returned a page instead of JSON.');
  return response.json();
}

export async function readCatalog(): Promise<CmsResult<CmsCatalog>> {
  try { return { data: normalizeCatalog(await fetchCmsJson('/catalog')), error: null }; }
  catch (error) {
    console.warn('CineStream catalog unavailable:', error instanceof Error ? error.message : 'Request failed');
    return { data: { shows: [], banners: [] }, error: 'CineStream catalog unavailable. The CMS must provide a public JSON API.' };
  }
}

export async function readEpisode(id: string): Promise<CmsResult<{ streamUrl: string } | null>> {
  try { return { data: normalizeManifest(await fetchCmsJson(`/episodes/${encodeURIComponent(id)}`)), error: null }; }
  catch (error) {
    console.warn('CineStream episode unavailable:', error instanceof Error ? error.message : 'Request failed');
    return { data: null, error: 'This episode is unavailable. Please try again.' };
  }
}