import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarArt from './AvatarArt';
import ProfileOnboarding from './ProfileOnboarding';
import { PROFILE_AVATARS, getAvatarLabel } from '@/nova/profile-rules';
import type { StoredProfile } from '@/nova/profile-store';

/** Shared add/edit profile dialog with one horizontal avatar slider, used on profile selection and the Profile page. */
export default function ProfileEditor({ profile, onSave, onCancel }: {
  profile: StoredProfile; onSave: (profile: StoredProfile) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<StoredProfile>({ ...profile, avatar: profile.avatar || PROFILE_AVATARS[0] });
  const [questions, setQuestions] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  // Endless slider: the avatar list is repeated three times and the middle copy is shown first,
  // so there are always avatars on both sides. Only the rail scrolls, never the dialog.
  const center = (el: HTMLElement | null | undefined, smooth: boolean) => {
    const box = rail.current;
    if (!box || !el) return;
    const offset = el.getBoundingClientRect().left - box.getBoundingClientRect().left;
    box.scrollTo({ left: box.scrollLeft + offset - (box.clientWidth - el.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };
  useEffect(() => {
    if (questions) return;
    const index = Math.max(0, PROFILE_AVATARS.indexOf(draft.avatar as (typeof PROFILE_AVATARS)[number]));
    center(rail.current?.children[PROFILE_AVATARS.length + index] as HTMLElement | undefined, false);
    nameInput.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);
  const wrap = () => {
    const box = rail.current;
    const first = box?.children[0] as HTMLElement | undefined;
    const second = box?.children[PROFILE_AVATARS.length] as HTMLElement | undefined;
    if (!box || !first || !second) return;
    const set = second.offsetLeft - first.offsetLeft;
    if (box.scrollLeft < set * 0.5) box.scrollLeft += set;
    else if (box.scrollLeft > set * 1.5) box.scrollLeft -= set;
  };

  if (questions) return <ProfileOnboarding name={draft.name.trim()} avatar={draft.avatar} grad={draft.grad} kid={draft.kid} initialLanguages={draft.languages ?? []} onCancel={() => setQuestions(false)} onDone={languages => onSave({ ...draft, name: draft.name.trim(), languages })} />;

  const dialog = <div role="dialog" aria-modal="true" aria-label={profile.name ? 'Edit Profile' : 'Add Profile'} className="fixed inset-0 z-[210] flex justify-center overflow-y-auto bg-nova-overlay p-4">
    <form onSubmit={event => { event.preventDefault(); if (draft.name.trim()) setQuestions(true); }} className="my-auto h-fit w-full max-w-md rounded-2xl border border-nova-line bg-nova-dark p-5 text-nova-text sm:p-6">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{profile.name ? 'Edit Profile' : 'Add Profile'}</h2><Button type="button" variant="novaAction" size="icon" aria-label="Cancel profile editing" onClick={onCancel}><X /></Button></div>
      <div className={`mx-auto mt-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${draft.grad} text-4xl shadow-xl ring-2 ring-nova-text/70 sm:h-24 sm:w-24 sm:text-5xl`}>
        <AvatarArt avatar={draft.avatar} kid={draft.kid} />
      </div>
      <p className="mt-2 text-center text-xs text-nova-muted">Avatar · {getAvatarLabel(draft.avatar || PROFILE_AVATARS[0])}</p>
      <div ref={rail} aria-label="Choose avatar" onScroll={wrap} className="-mx-5 mt-2 flex gap-3 overflow-x-auto px-5 sm:-mx-6 sm:px-6 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[0, 1, 2].flatMap(copy => PROFILE_AVATARS.map(avatar => {
          const on = draft.avatar === avatar;
          const main = copy === 1;
          const label = getAvatarLabel(avatar);
          return <button type="button" key={`${copy}-${avatar}`} aria-label={`Avatar ${label}`} title={label} aria-pressed={on} aria-hidden={main ? undefined : true} tabIndex={main ? 0 : -1}
            onClick={event => { setDraft({ ...draft, avatar }); center(event.currentTarget, true); }}
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${draft.grad} text-2xl transition duration-200 ${on ? 'ring-2 ring-nova-text/60 ring-offset-2 ring-offset-nova-dark shadow-[0_0_16px_rgb(255_255_255/0.22)]' : 'ring-1 ring-nova-line'}`}>
            <AvatarArt avatar={avatar} />
          </button>;
        }))}
      </div>
      <label htmlFor="profile-editor-name" className="mt-3 block text-xs text-nova-muted">Profile name</label>
      <Input id="profile-editor-name" aria-label="Profile name" placeholder="Profile name" maxLength={20} ref={nameInput} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} className="mt-2 h-12 border-nova-line bg-nova-black text-nova-text" />
      <Button type="submit" disabled={!draft.name.trim()} variant="novaAction" className="nova-pill-solid mt-4 h-12 w-full rounded-full text-nova-text">Next</Button>
    </form>
  </div>;
  return typeof document !== 'undefined' ? createPortal(dialog, document.body) : dialog;
}
