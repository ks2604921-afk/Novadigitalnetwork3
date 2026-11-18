import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { discoverySchema, announcementSchema, subscriptionSchema } from './discovery-rules';

export const listDiscoveryAdmin = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (roleError || !allowed) throw new Error('Admin access required');
  const { data, error } = await context.supabase.from('discovery_items').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
});
export const saveDiscovery = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(discoverySchema).handler(async ({ data, context }) => {
  const { data: allowed, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (roleError || !allowed) throw new Error('Admin access required');
  const { id, ...row } = data;
  const result = id ? await context.supabase.from('discovery_items').update(row).eq('id', id) : await context.supabase.from('discovery_items').insert(row);
  if (result.error) throw new Error(result.error.message);
  return { ok: true };
});
export const deleteDiscovery = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
  const { data: allowed } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!allowed) throw new Error('Admin access required');
  const { error } = await context.supabase.from('discovery_items').delete().eq('id', data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
});
export const setupPush = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!allowed) throw new Error('Admin access required');
  const { getPushConfig } = await import('./push.server');
  return { publicKey: (await getPushConfig(true)).public_key };
});
export const getPushPublicKey = createServerFn({ method: 'GET' }).handler(async () => {
  const { getPushConfig } = await import('./push.server');
  try { return { publicKey: (await getPushConfig(false)).public_key }; } catch { return { publicKey: null }; }
});
export const registerPhonePush = createServerFn({ method: 'POST' }).inputValidator(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), subscription: subscriptionSchema })).handler(async ({ data }) => {
  const { requirePhoneSession } = await import('./phone-session.server');
  const { db, userId } = await requirePhoneSession(data.token);
  const { error } = await db.from('nova_push_devices').upsert({ user_id: userId, endpoint: data.subscription.endpoint, subscription: data.subscription }, { onConflict: 'endpoint' });
  if (error) throw new Error(error.message);
  return { ok: true };
});
export const registerAccountPush = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(subscriptionSchema).handler(async ({ data, context }) => {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { error } = await db.from('nova_push_devices').upsert({ user_id: context.userId, endpoint: data.endpoint, subscription: data }, { onConflict: 'endpoint' });
  if (error) throw new Error(error.message);
  return { ok: true };
});
export const sendAnnouncement = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(announcementSchema).handler(async ({ data, context }) => {
  const { data: allowed } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!allowed) throw new Error('Admin access required');
  const { title, body, path, push } = data;
  const { data: note, error } = await context.supabase.from('nova_announcements').insert({ title, body, path }).select('id').single();
  if (error) throw new Error(error.message);
  if (!push) return { id: note.id, accepted: 0, failed: 0, devices: 0 };
  const { sendPush } = await import('./push.server');
  return { id: note.id, ...await sendPush({ title, body, path }) };
});
export const listAnnouncements = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
    const { data, error } = await db
      .from('nova_announcements')
      .select('id, title, body, path, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []) as Array<{ id: string; title: string; body: string; path: string; created_at: string }>;
  } catch {
    return [];
  }
});