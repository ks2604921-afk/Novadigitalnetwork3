import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Bell, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getPushPublicKey, registerAccountPush, registerPhonePush } from '@/lib/discovery.functions';

export default function PushSettings() {
  const getKey = useServerFn(getPushPublicKey), register = useServerFn(registerAccountPush), registerPhone = useServerFn(registerPhonePush);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [detached, setDetached] = useState(false);
  async function enable() {
    if (window.top !== window.self) { setDetached(true); setMessage('Open NOVA in its own tab to allow notifications.'); return; }
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) { setMessage('Notifications are not supported here. On iPhone, add NOVA to your Home Screen first.'); return; }
    setBusy(true);
    try {
      const { data: account } = await supabase.auth.getSession();
      const token = localStorage.getItem('nova_session_token');
      if (!account.session && !token) { setMessage('A verified account is required. Sample login cannot register notifications.'); return; }
      // Request permission before asynchronous network work loses the click gesture.
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') { setMessage('Notifications are blocked. Allow them in your browser’s site settings.'); return; }
      const { publicKey } = await getKey();
      if (!publicKey) { setMessage('Admin needs to enable browser push in Notifications first.'); return; }
      const worker = await navigator.serviceWorker.register('/nova-messaging-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const raw = atob(publicKey.replace(/-/g, '+').replace(/_/g, '/'));
      const applicationServerKey = Uint8Array.from(raw, c => c.charCodeAt(0));
      const subscription = await worker.pushManager.getSubscription() ?? await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const value = subscription.toJSON();
      if (!value.endpoint || !value.keys?.['p256dh'] || !value.keys['auth']) throw new Error('Could not register this browser.');
      const data = { endpoint: value.endpoint, expirationTime: value.expirationTime ?? null, keys: { p256dh: value.keys['p256dh'], auth: value.keys['auth'] } };
      if (account.session) await register({ data });
      else if (token) await registerPhone({ data: { token, subscription: data } });
      setMessage('Notifications enabled on this device.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not enable notifications. Try again.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3 py-4"><Button variant="novaAction" disabled={busy} onClick={enable} className="nova-pill rounded-full text-nova-text"><Bell />{busy ? 'Enabling…' : 'Enable push notifications'}</Button>{message && <p role="status" className="text-sm text-nova-muted">{message}</p>}{detached && <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-nova-accent"><ExternalLink className="size-4" />Open NOVA in new tab</a>}</div>;
}