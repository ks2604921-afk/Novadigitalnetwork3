import { queryOptions } from '@tanstack/react-query';
import { getCineStreamCatalog } from '@/lib/cinestream.functions';
import { CATALOG_REFRESH_MS } from './cinestream';

export const cineStreamCatalogOptions = queryOptions({
  queryKey: ['cinestream', 'catalog'],
  queryFn: () => getCineStreamCatalog(),
  staleTime: 0,
  refetchInterval: CATALOG_REFRESH_MS,
  refetchOnWindowFocus: 'always',
  refetchOnReconnect: 'always',
});