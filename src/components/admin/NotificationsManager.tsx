import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listAnnouncements, setupPush, sendAnnouncement } from '@/lib/discovery.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import PushSettings from '@/nova/components/PushSettings';
export default function NotificationsManager() {
  const setup = useServerFn(setupPush), send = useServerFn(sendAnnouncement), fetchHistory = useServerFn(listAnnouncements), qc = useQueryClient();
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [path, setPath] = useState('/'), [push, setPush] = useState(false), [result, setResult] = useState('');
  const enable = useMutation({ mutationFn: () => setup(), onSuccess: () => setResult('Browser push enabled. Register this device below.'), onError: error => setResult(error.message) });
  const publish = useMutation({ mutationFn: () => send({ data: { title, body, path, push } }), onSuccess: value => { setResult(`Published in app. Push: ${value.accepted} accepted, ${value.failed} failed, ${value.devices} registered devices.`); setTitle(''); setBody(''); qc.invalidateQueries({ queryKey: ['nova', 'announcements'] }); }, onError: error => setResult(`Could not complete: ${error.message}. Check notification history before retrying.`) });
  const { data: history, error } = useQuery({ queryKey: ['nova', 'announcements'], queryFn: () => fetchHistory() });
  return <div className="space-y-6"><Button variant="outline" disabled={enable.isPending} onClick={() => enable.mutate()}>Enable browser push</Button><PushSettings /><form className="max-w-xl space-y-4" onSubmit={event => { event.preventDefault(); publish.mutate(); }}><div><Label htmlFor="note-title">Title</Label><Input id="note-title" required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} /></div><div><Label htmlFor="note-body">Message</Label><Textarea id="note-body" required maxLength={500} value={body} onChange={event => setBody(event.target.value)} /></div><div><Label htmlFor="note-path">Open app path</Label><Input id="note-path" required value={path} onChange={event => setPath(event.target.value)} /></div><div className="flex items-center justify-between"><Label htmlFor="send-push">Also send browser push</Label><Switch id="send-push" checked={push} onCheckedChange={setPush} /></div><Button type="submit" disabled={publish.isPending}>{publish.isPending ? 'Sending…' : 'Publish notification'}</Button></form>{result && <p role="status" className="text-sm text-muted-foreground">{result}</p>}{error && <p role="alert">{error.message}</p>}<h2 className="font-semibold">Notification history</h2>{history?.map(note => <article key={note.id} className="border-b border-border py-3"><p className="font-semibold">{note.title}</p><p className="text-sm text-muted-foreground">{note.body}</p><time className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</time></article>)}</div>;
}