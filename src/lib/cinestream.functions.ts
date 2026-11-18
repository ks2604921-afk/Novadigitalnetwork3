import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

// Public, read-only CMS endpoints. No admin credentials or user data are forwarded.
export const getCineStreamCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const { readCatalog } = await import('./cinestream.server');
  return readCatalog();
});

export const getCineStreamEpisode = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const { readEpisode } = await import('./cinestream.server');
    return readEpisode(data.id);
  });