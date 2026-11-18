import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { listWatchingProfiles, saveWatchingProfile, deleteWatchingProfile } from '@/lib/watching-profiles.functions';
import { avatarIds, watchingProfileSchema, type WatchingProfile } from '@/nova/watching-profile-rules';
import { saveActiveProfile } from '@/nova/profile-store';
import ProfileAvatar from './ProfileAvatar';

export default function WatchingProfiles({ onPick, editing, onEditingChange }: { onPick: (id: string) => void; editing: boolean; onEditingChange?: (value: boolean) => void }) {
  const { session } = useAuth();
  const list = useServerFn(listWatchingProfiles);
  const save = useServerFn(saveWatchingProfile);
  const remove = useServerFn(deleteWatchingProfile);
  const [profiles, setProfiles] = useState<WatchingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<{ id?: string; name: string; avatar: WatchingProfile['avatar']; kid: boolean } | null>(null);
  const [deleting, setDeleting] = useState<WatchingProfile | null>(null);
  const refresh = async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setProfiles(await list({ data: { token: session.token } })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load profiles.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [session?.token]);
  useEffect(() => {
    if (!draft && !deleting) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) { setDraft(null); setDeleting(null); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [draft, deleting, busy]);
  const submit = async () => {
    if (!draft || !session) return;
    const parsed = watchingProfileSchema.safeParse(draft);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check the profile name.'); return; }
    setBusy(true); setError('');
    try {
      const row = await save({ data: { token: session.token, id: draft.id, profile: parsed.data } });
      setProfiles(previous => draft.id ? previous.map(p => p.id === row.id ? row : p) : [...previous, row]);
      setDraft(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save profile.'); }
    finally { setBusy(false); }
  };
  const deleteProfile = async () => {
    if (!session || !deleting) return;
    setBusy(true); setError('');
    try {
      await remove({ data: { token: session.token, id: deleting.id } });
      setProfiles(previous => previous.filter(p => p.id !== deleting.id));
      setDeleting(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete profile.'); }
    finally { setBusy(false); }
  };
  return <>
    {loading ? <p role="status" className="text-center text-nova-muted">Loading profiles…</p> :
    <div className="flex flex-wrap justify-center gap-x-7 gap-y-8">
      {profiles.map(p => <div key={p.id} className="flex w-28 flex-col items-center">
        <Button variant="novaAction" disabled={editing} aria-label={`Watch as ${p.name}`} onClick={() => { saveActiveProfile(p.id); onPick(p.id); }} className="h-28 w-28 rounded-full p-0 ring-2 ring-transparent hover:ring-nova-text [&_svg]:size-12">
          <ProfileAvatar avatar={p.avatar} />
        </Button>
        <div className="mt-3 flex max-w-full items-center gap-1">
          <span className="truncate text-sm text-nova-muted">{p.name}</span>
          {editing && <Button variant="novaAction" size="icon-sm" aria-label={`Edit name for ${p.name}`} title="Edit name" onClick={() => { setError(''); setDraft(p); }}><Pencil /></Button>}
        </div>
        {editing && <Button variant="novaAction" className="mt-1 h-8 text-xs" aria-label={`Delete ${p.name}`} onClick={() => { setError(''); setDeleting(p); }}><Trash2 />Delete</Button>}
      </div>)}
      <div className="flex w-28 flex-col items-center">
        <Button variant="novaAction" aria-label="Add profile" onClick={() => { setError(''); setDraft({ name: '', avatar: 'orbit', kid: false }); }} className="h-28 w-28 rounded-full border border-dashed border-nova-text/25 bg-nova-text/5 p-0 [&_svg]:size-8"><Plus /></Button>
        <span className="mt-3 text-sm text-nova-muted">Add</span>
      </div>
    </div>}
    {error && !draft && !deleting && <div className="mt-6 text-center"><p role="alert" className="text-sm text-nova-heart">{error}</p><Button variant="novaAction" onClick={() => void refresh()}>Try again</Button></div>}
    {onEditingChange && <div className="mt-6 text-center"><Button variant="novaAction" onClick={() => onEditingChange(!editing)}>{editing ? <Check /> : <Pencil />}{editing ? 'Done' : 'Edit profiles'}</Button></div>}
    {(draft || deleting) && <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-nova-overlay p-5" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
      <div className="relative my-auto w-full max-w-md rounded-lg border border-nova-line bg-nova-dark p-6">
        <Button variant="novaAction" size="icon" disabled={busy} aria-label="Close profile form" className="absolute right-3 top-3" onClick={() => { setDraft(null); setDeleting(null); }}><X /></Button>
        <h2 id="profile-dialog-title" className="pr-10 text-xl font-semibold text-nova-text">{deleting ? 'Delete profile?' : draft?.id ? 'Edit profile' : 'Add profile'}</h2>
        {draft && <form onSubmit={e => { e.preventDefault(); void submit(); }}>
          <div className="mx-auto my-5 h-24 w-24"><ProfileAvatar avatar={draft.avatar} /></div>
          <div className="mb-6 grid grid-cols-6 gap-2" aria-label="Choose an avatar">{avatarIds.map(avatar => <Button key={avatar} variant="novaAction" aria-label={`Choose ${avatar} avatar`} aria-pressed={draft.avatar === avatar} onClick={() => setDraft({ ...draft, avatar })} className={`aspect-square h-auto w-full rounded-full p-0 [&_svg]:size-6 [&_span]:text-2xl ${draft.avatar === avatar ? 'ring-2 ring-nova-accent' : ''}`}><ProfileAvatar avatar={avatar} /></Button>)}</div>
          <label htmlFor="watching-name" className="text-sm text-nova-muted">Profile name</label>
          <Input id="watching-name" autoFocus autoComplete="off" maxLength={20} placeholder="Enter name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="mt-2 h-12 border-nova-line bg-nova-black text-nova-text" />
          {error && <p role="alert" className="mt-3 text-sm text-nova-heart">{error}</p>}
          <Button type="submit" disabled={busy || !draft.name.trim()} className="nova-login-action mt-6 h-12 w-full text-nova-text">{busy ? 'Saving…' : 'Save profile'}</Button>
        </form>}
        {deleting && <><p className="mt-5 text-sm text-nova-muted">Delete {deleting.name} from this account?</p>{error && <p role="alert" className="mt-3 text-sm text-nova-heart">{error}</p>}<div className="mt-6 flex justify-end gap-3"><Button variant="novaAction" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button disabled={busy} onClick={() => void deleteProfile()} className="bg-nova-heart text-nova-text hover:bg-nova-heart/90"><Trash2 />{busy ? 'Deleting…' : 'Delete'}</Button></div></>}
      </div>
    </div>}
  </>;
}