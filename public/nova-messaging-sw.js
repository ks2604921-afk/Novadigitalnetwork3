self.addEventListener('push', event => {
  let note;
  try { note = event.data.json(); } catch { return; }
  event.waitUntil(self.registration.showNotification(note.title || 'NOVA', { body: note.body || '', data: { path: note.path || '/' } }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.path || '/', self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === url.origin) { await client.navigate(url.href); return client.focus(); }
    }
    return self.clients.openWindow(url.href);
  })());
});