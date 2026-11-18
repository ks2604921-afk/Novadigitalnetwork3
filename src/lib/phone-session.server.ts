export async function requirePhoneSession(token: string) {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: session, error } = await db.from('sessions').select('user_id, expires_at').eq('token', token).maybeSingle();
  if (error || !session || new Date(session.expires_at).getTime() <= Date.now()) throw new Error('Please sign in again.');
  const { data: user } = await db.from('users').select('id, is_blocked').eq('id', session.user_id).maybeSingle();
  if (!user || user.is_blocked) throw new Error('Account unavailable.');
  return { db, userId: user.id };
}