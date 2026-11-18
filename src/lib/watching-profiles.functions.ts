import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { watchingProfileSchema } from '@/nova/watching-profile-rules';

const sessionSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) });
export const listWatchingProfiles = createServerFn({ method: 'POST' })
  .inputValidator(sessionSchema)
  .handler(async ({ data }) => {
    const { requirePhoneSession } = await import('./phone-session.server');
    const { db, userId } = await requirePhoneSession(data.token);
    setResponseHeader('Cache-Control', 'no-store');
    const { data: rows, error } = await db.from('watching_profiles').select('id, name, avatar, kid').eq('user_id', userId).order('created_at');
    if (error) throw new Error('Could not load profiles. Try again.');
    return (rows ?? []).map(row => ({ id: row.id, ...watchingProfileSchema.parse(row) }));
  });
export const saveWatchingProfile = createServerFn({ method: 'POST' })
  .inputValidator(sessionSchema.extend({ id: z.string().uuid().optional(), profile: watchingProfileSchema }))
  .handler(async ({ data }) => {
    const { requirePhoneSession } = await import('./phone-session.server');
    const { db, userId } = await requirePhoneSession(data.token);
    setResponseHeader('Cache-Control', 'no-store');
    const query = data.id
      ? db.from('watching_profiles').update(data.profile).eq('id', data.id).eq('user_id', userId)
      : db.from('watching_profiles').insert({ ...data.profile, user_id: userId });
    const { data: row, error } = await query.select('id, name, avatar, kid').single();
    if (error || !row) throw new Error('Could not save this profile. Try again.');
    return { id: row.id, ...watchingProfileSchema.parse(row) };
  });
export const deleteWatchingProfile = createServerFn({ method: 'POST' })
  .inputValidator(sessionSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requirePhoneSession } = await import('./phone-session.server');
    const { db, userId } = await requirePhoneSession(data.token);
    setResponseHeader('Cache-Control', 'no-store');
    const { data: row, error } = await db.from('watching_profiles').delete().eq('id', data.id).eq('user_id', userId).select('id').single();
    if (error || !row) throw new Error('Could not delete this profile. Try again.');
    return { id: row.id };
  });