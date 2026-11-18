import { buildPushPayload } from '@block65/webcrypto-web-push';
import { supabaseAdmin as db } from '@/integrations/supabase/client.server';
import { subscriptionSchema } from './discovery-rules';

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function getPushConfig(create: boolean) {
  const existing = await db.from('nova_push_config').select('*').eq('id', 1).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;
  if (!create) throw new Error('Push is not enabled by admin yet');
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const public_key = encode(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  const private_jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const saved = await db.from('nova_push_config').upsert({ id: 1, public_key, private_jwk: JSON.parse(JSON.stringify(private_jwk)) }, { onConflict: 'id', ignoreDuplicates: true });
  if (saved.error) throw new Error(saved.error.message);
  const result = await db.from('nova_push_config').select('*').eq('id', 1).single();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function sendPush(note: { title: string; body: string; path: string }) {
  const config = await getPushConfig(false);
  const jwk = config.private_jwk as JsonWebKey;
  if (!jwk.d) throw new Error('Push signing key unavailable');
  const { data: devices, error } = await db.from('nova_push_devices').select('id, subscription');
  if (error) throw new Error(error.message);
  let accepted = 0, failed = 0;
  const rows = devices ?? [];
  // Batches bound simultaneous requests without dropping registered devices.
  for (let offset = 0; offset < rows.length; offset += 10) {
    await Promise.all(rows.slice(offset, offset + 10).map(async device => {
      try {
        const subscription = subscriptionSchema.parse(device.subscription);
        const subject = process.env['VAPID_SUBJECT']?.trim() || 'mailto:notifications@novadigital.app';
        const payload = await buildPushPayload({ data: JSON.stringify(note), options: { ttl: 86400 } }, subscription, { subject, publicKey: config.public_key, privateKey: jwk.d });
        const response = await fetch(subscription.endpoint, { ...payload, redirect: 'error' });
        if (response.ok) accepted++;
        else {
          failed++;
          console.error('Push delivery rejected', response.status, await response.text());
          if (response.status === 404 || response.status === 410) await db.from('nova_push_devices').delete().eq('id', device.id);
        }
      } catch { failed++; }
    }));
  }
  return { accepted, failed, devices: rows.length };
}