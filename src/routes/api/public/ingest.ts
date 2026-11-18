import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

const url = z.string().url().max(2000).nullish();

const showSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullish(),
  thumbnail_url: url,
  banner_url: url,
  genres: z.array(z.string().max(60)).max(20).optional(),
  languages: z.array(z.string().max(60)).max(20).optional(),
  category: z.string().max(60).nullish(),
  rating: z.number().min(0).max(10).nullish(),
  release_year: z.number().int().min(1900).max(2100).nullish(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
});

const seasonSchema = z.object({
  id: z.string().uuid().optional(),
  show_id: z.string().uuid(),
  season_number: z.number().int().min(0).max(1000),
  title: z.string().max(300).nullish(),
});

const episodeSchema = z.object({
  id: z.string().uuid().optional(),
  season_id: z.string().uuid(),
  show_id: z.string().uuid(),
  episode_number: z.number().int().min(0).max(10000),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullish(),
  thumbnail_url: url,
  duration_seconds: z.number().int().min(0).max(100000).nullish(),
  stream_url: url,
});

const bodySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('show'), data: showSchema }),
  z.object({ type: z.literal('season'), data: seasonSchema }),
  z.object({ type: z.literal('episode'), data: episodeSchema }),
  z.object({ type: z.literal('delete'), table: z.enum(['shows', 'seasons', 'episodes']), id: z.string().uuid() }),
]);

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const Route = createFileRoute('/api/public/ingest')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const secret = process.env['INGEST_API_KEY'];
        if (!secret) return json({ error: 'Ingest key not configured' }, 503);
        const key = request.headers.get('x-api-key') ?? '';
        if (!safeEqual(key, secret)) return json({ error: 'Invalid API key' }, 401);

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: 'Body must be JSON' }, 400);
        }
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) return json({ error: 'Invalid payload', issues: parsed.error.flatten() }, 400);

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const p = parsed.data;

        if (p.type === 'delete') {
          const { error } = await supabaseAdmin.from(p.table).delete().eq('id', p.id);
          if (error) return json({ error: error.message }, 400);
          return json({ ok: true, deleted: p.id });
        }

        const table = p.type === 'show' ? 'shows' : p.type === 'season' ? 'seasons' : 'episodes';
        const conflict = p.type === 'show' ? 'id' : p.type === 'season' ? (p.data.id ? 'id' : 'show_id,season_number') : (p.data.id ? 'id' : 'season_id,episode_number');
        const { data, error } = await supabaseAdmin
          .from(table)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(p.data as any, { onConflict: conflict })
          .select('id')
          .single();
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, id: data.id });
      },
    },
  },
});
