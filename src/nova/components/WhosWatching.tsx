import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, MoreVertical, Palette, Pencil, Plus, Trash2, Type, X } from 'lucide-react';
import AvatarArt from '@/nova/components/AvatarArt';
import Logo from '@/nova/components/Logo';
import ProfileBadge from '@/nova/components/ProfileBadge';
import ProfileEditor from '@/nova/components/ProfileEditor';
import ProfileEditActions from '@/nova/components/ProfileEditActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PROFILE_AVATARS, createProfileDraft, getAvatarLabel, insertBeforeKids, removeProfile } from '@/nova/profile-rules';
import {
  defaultProfiles,
  formatLastActive,
  loadActiveProfile,
  loadProfileActivity,
  loadProfiles,
  saveActiveProfile,
  saveProfiles,
  type StoredProfile,
} from '@/nova/profile-store';

/** `allowEdit` is off on TV/desktop, where the picker uses the pill menu or mobile editor. */
export default function WhosWatching({
  onPick,
  allowEdit = true,
  tvMode = false,
}: {
  onPick: (id: string) => void;
  allowEdit?: boolean;
  tvMode?: boolean;
}) {
  const [profiles, setProfiles] = useState<StoredProfile[]>(defaultProfiles);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StoredProfile | null>(null);
  const [activeId, setActiveId] = useState<string>('p1');
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<StoredProfile | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [avatarPicking, setAvatarPicking] = useState<StoredProfile | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<number | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadProfiles();
    setProfiles(loaded);
    setActivity(loadProfileActivity());
    const storedActive = loadActiveProfile();
    if (storedActive && loaded.some((p) => p.id === storedActive)) {
      setActiveId(storedActive);
    } else if (loaded[0]) {
      setActiveId(loaded[0].id);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest('[data-profile-menu-root]')) {
        setMenuOpenId(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpenId(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpenId]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const commit = (next: StoredProfile[]) => {
    setProfiles(next);
    saveProfiles(next);
    if (next.length > 0 && !next.some((p) => p.id === activeId)) {
      setActiveId(next[0]!.id);
    }
  };

  const openAdd = () => {
    setMenuOpenId(null);
    setDraft(createProfileDraft(profiles, `p${Date.now()}`));
  };
  const openEdit = (profile: StoredProfile) => {
    setMenuOpenId(null);
    setDraft(profile);
  };

  const remove = (id: string) => {
    setMenuOpenId(null);
    commit(removeProfile(profiles, id));
  };

  const enterProfile = (id: string) => {
    if (enteringId) return;
    setMenuOpenId(null);
    saveActiveProfile(id);
    setActivity(loadProfileActivity());
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !tvMode) {
      onPick(id);
      return;
    }
    setEnteringId(id);
    enterTimerRef.current = window.setTimeout(() => {
      onPick(id);
    }, 240);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!tvMode || menuOpenId || renaming || avatarPicking || draft) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + step + profiles.length) % profiles.length;
    const nextProfile = profiles[nextIndex];
    if (!nextProfile) return;
    event.preventDefault();
    setActiveId(nextProfile.id);
    const btn = rowRef.current?.querySelector<HTMLElement>(`[data-profile-watch="${nextProfile.id}"]`);
    btn?.focus();
  };

  if (tvMode) {
    const tvContent = (
      <div
        data-testid="tv-profile-selection"
        className={`fixed inset-0 z-[200] flex min-h-dvh w-screen flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#050507] text-white ${enteringId ? 'nova-tv-entering pointer-events-none' : ''}`}
      >
        {/* Animated purple & electric pink flowing light waves across the entire viewport */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="nova-tv-wave-top absolute -top-24 inset-x-0 h-80 w-full" />
          <div className="nova-tv-wave-bottom absolute -bottom-24 inset-x-0 h-80 w-full" />
          <div className="nova-tv-wave-edge-top absolute inset-x-0 top-0 h-[2px] opacity-85" />
          <div className="nova-tv-wave-edge-bottom absolute inset-x-0 bottom-0 h-[2px] opacity-80" />
          <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(114,0,255,0.22),transparent_70%)]" />
          <div className="absolute -right-24 bottom-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,0,184,0.2),transparent_70%)]" />
        </div>

        {/* Centered NOVA Header */}
        <header className="relative z-10 flex flex-col items-center px-6 pt-12 text-center sm:pt-16">
          <Logo size="lg" />
        </header>

        {/* Full-Screen Profile Section */}
        <main className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 pb-20 pt-8 sm:px-12 lg:px-20">
          <div className="mb-10 text-center sm:mb-14">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Who&apos;s Watching?
            </h1>
            <p className="mt-3 text-sm text-white/95 sm:text-base">
              Choose your profile to continue.
            </p>
          </div>

          <div
            ref={rowRef}
            role="list"
            aria-label="Profiles"
            className="flex w-full max-w-6xl flex-wrap items-center justify-center gap-5 sm:gap-8"
          >
            {profiles.map((p, idx) => {
              const selected = p.id === activeId;
              const menuOpen = menuOpenId === p.id;
              const lastActiveText = formatLastActive(p.id, idx, activity);

              return (
                <div
                  key={p.id}
                  role="listitem"
                  data-profile-id={p.id}
                  data-profile-expanded={selected ? 'true' : 'false'}
                  onMouseEnter={() => {
                    if (!menuOpenId) setActiveId(p.id);
                  }}
                  onFocusCapture={() => setActiveId(p.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, idx)}
                  className="relative flex flex-col items-center transition-all duration-300 ease-out"
                >
                  {selected ? (
                    <div className="nova-tv-pill-border relative rounded-full p-[2px] transition-all duration-300 ease-out">
                      <div className="nova-tv-pill-glass flex items-center gap-4 rounded-full py-2.5 pl-2.5 pr-4 sm:gap-5 sm:py-3 sm:pl-3 sm:pr-5">
                        <button
                          type="button"
                          data-profile-watch={p.id}
                          aria-label={`Watch as ${p.name}`}
                          onClick={() => enterProfile(p.id)}
                          className="group flex items-center gap-3.5 rounded-full pr-2 text-left outline-none transition-transform duration-300 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[#FF00B8]/70 sm:gap-4"
                        >
                          <span className="relative shrink-0 rounded-full ring-2 ring-[#F5F2FF]/35 transition-transform duration-300 group-hover:scale-105">
                            <ProfileBadge
                              profile={p}
                              className="!h-16 !w-16 !text-3xl sm:!h-20 sm:!w-20 sm:!text-4xl"
                            />
                            {p.kid && (
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#7200FF] to-[#FF00B8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md">
                                Kids
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 max-w-[170px] sm:max-w-[210px]">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                                {p.name}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs font-medium text-white/95">
                              {lastActiveText}
                            </span>
                          </span>
                        </button>

                        <div data-profile-menu-root className="relative shrink-0">
                          <button
                            type="button"
                            aria-label={`Profile options for ${p.name}`}
                            aria-expanded={menuOpen}
                            aria-haspopup="menu"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpen ? null : p.id);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/[0.08] text-white transition hover:border-[#FF00B8]/60 hover:bg-[#7200FF]/25 hover:text-white hover:shadow-[0_0_16px_rgba(255,0,184,0.45)]"
                          >
                            <MoreVertical className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                          </button>

                          {menuOpen && (
                            <div
                              role="menu"
                              aria-label={`${p.name} options`}
                              className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-[#A020F0]/40 bg-[#0f1219]/[0.92] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.85),0_0_24px_rgba(114,0,255,0.3)] animate-in fade-in zoom-in-95 duration-150"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => openEdit(p)}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#7200FF]/25"
                              >
                                <Pencil className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                                Edit Profile
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setRenaming(p);
                                  setRenameValue(p.name);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#7200FF]/25"
                              >
                                <Type className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                                Rename Profile
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setAvatarPicking(p);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#7200FF]/25"
                              >
                                <Palette className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                                Change Avatar
                              </button>
                              <div className="my-1 h-px bg-white/10" />
                              <button
                                type="button"
                                role="menuitem"
                                disabled={profiles.length <= 1}
                                onClick={() => remove(p.id)}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#FF00B8]/20 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <Trash2 className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                                Delete Profile
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5">
                      <button
                        type="button"
                        data-profile-watch={p.id}
                        aria-label={`Watch as ${p.name}`}
                        onClick={() => enterProfile(p.id)}
                        className="group relative rounded-full p-[2px] ring-1 ring-white/25 transition-all duration-300 ease-out hover:scale-110 hover:ring-[#A020F0] hover:shadow-[0_0_28px_rgba(160,32,240,0.55)]"
                      >
                        <ProfileBadge
                          profile={p}
                          className="!h-20 !w-20 !text-3xl sm:!h-24 sm:!w-24 sm:!text-4xl"
                        />
                        {p.kid && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#7200FF] to-[#FF00B8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                            Kids
                          </span>
                        )}
                      </button>
                      <span className="max-w-[96px] truncate text-xs font-medium text-white">
                        {p.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Illuminated Add Profile Button */}
            <div role="listitem" className="flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={openAdd}
                aria-label="Add profile"
                className="nova-tv-add-btn group relative flex h-20 w-20 items-center justify-center rounded-full border border-[#A020F0]/55 text-white transition-all duration-300 hover:scale-110 hover:border-[#FF00B8] hover:text-white hover:shadow-[0_0_32px_rgba(255,0,184,0.55)] sm:h-24 sm:w-24"
              >
                <Plus className="h-8 w-8 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] transition-transform duration-300 group-hover:rotate-90" />
              </button>
              <span className="text-xs font-medium text-white">Add Profile</span>
            </div>
          </div>
        </main>

        {/* Rename Profile Dialog */}
        {renaming && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Rename ${renaming.name}`}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0f1219]/[0.92] p-4"
            onClick={() => setRenaming(null)}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = renameValue.trim();
                if (!trimmed) return;
                commit(profiles.map((item) => (item.id === renaming.id ? { ...item, name: trimmed } : item)));
                setRenaming(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-[#A020F0]/40 bg-[#0d0a16] p-6 text-[#F5F2FF] shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_36px_rgba(114,0,255,0.28)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Rename Profile</h2>
                <Button
                  type="button"
                  variant="novaAction"
                  size="icon"
                  aria-label="Cancel rename"
                  onClick={() => setRenaming(null)}
                  className="text-white"
                >
                  <X className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                </Button>
              </div>
              <label htmlFor="tv-rename-input" className="mt-4 block text-xs text-white/95">
                Profile name
              </label>
              <Input
                id="tv-rename-input"
                ref={renameInputRef}
                maxLength={20}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="mt-2 h-11 border-white/20 bg-[#050507] text-white"
              />
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setRenaming(null)} className="text-white">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="rounded-full bg-gradient-to-r from-[#7200FF] to-[#FF00B8] px-5 font-semibold text-white hover:brightness-110"
                >
                  Save Name
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Avatar Picker Dialog */}
        {avatarPicking && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Change avatar for ${avatarPicking.name}`}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0f1219]/[0.92] p-4"
            onClick={() => setAvatarPicking(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-[#A020F0]/40 bg-[#0d0a16] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_36px_rgba(114,0,255,0.28)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Change Avatar</h2>
                <Button
                  type="button"
                  variant="novaAction"
                  size="icon"
                  aria-label="Close avatar picker"
                  onClick={() => setAvatarPicking(null)}
                  className="text-white"
                >
                  <X className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-white/95">Choose an avatar for {avatarPicking.name}</p>
              <div className="mt-5 grid grid-cols-5 gap-3">
                {PROFILE_AVATARS.map((av) => {
                  const selectedAv = (avatarPicking.avatar || 'normal') === av;
                  const label = getAvatarLabel(av);
                  return (
                    <button
                      key={av}
                      type="button"
                      aria-label={`Select avatar ${label}`}
                      title={label}
                      aria-pressed={selectedAv}
                      onClick={() => {
                        commit(profiles.map((item) => (item.id === avatarPicking.id ? { ...item, avatar: av } : item)));
                        setAvatarPicking(null);
                      }}
                      className={`flex h-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${avatarPicking.grad} text-3xl transition hover:scale-105 ${
                        selectedAv ? 'ring-2 ring-[#FF00B8] shadow-[0_0_20px_rgba(255,0,184,0.45)]' : 'ring-1 ring-white/15'
                      }`}
                    >
                      <AvatarArt avatar={av} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {draft && (
          <ProfileEditor
            profile={draft}
            onCancel={() => setDraft(null)}
            onSave={(profile) => {
              const existing = profiles.some((p) => p.id === profile.id);
              commit(existing ? profiles.map((p) => (p.id === profile.id ? profile : p)) : insertBeforeKids(profiles, profile));
              setDraft(null);
              if (!existing) {
                enterProfile(profile.id);
              }
            }}
          />
        )}
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(tvContent, document.body) : tvContent;
  }

  const tile = (p: (typeof profiles)[number]) => (
    <div key={p.id} className="flex w-24 flex-col items-center gap-2 sm:w-28">
      <button
        onClick={() => (editing ? openEdit(p) : (saveActiveProfile(p.id), onPick(p.id)))}
        aria-label={editing ? `Change ${p.name}` : `Watch as ${p.name}`}
        className="relative rounded-full transition hover:scale-105"
      >
        <ProfileBadge profile={p} />
        {editing && <span className="absolute inset-0 rounded-full bg-nova-black/40" />}
      </button>
      <p className="w-full truncate text-center text-sm text-nova-muted">{p.name}</p>
      {editing && <ProfileEditActions name={p.name} onEdit={() => openEdit(p)} onDelete={() => remove(p.id)} canDelete={profiles.length > 1} />}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-nova-black">
      <header className="flex items-center justify-between gap-3 bg-nova-black px-5 py-4 sm:px-10">
        <Logo />
        {allowEdit && <button
          onClick={() => setEditing((e) => !e)}
          aria-label={editing ? 'Done editing profiles' : 'Edit profiles'}
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-white underline-offset-4 hover:underline"
        >
          {editing ? <Check className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> : <Pencil className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />}
          {editing ? 'Done' : 'Edit'}
        </button>}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-16">
        <h1 className="mb-8 text-2xl font-bold text-white sm:text-3xl">
          {editing ? 'Edit Profiles' : "Who's Watching?"}
        </h1>
        <div className="flex w-full max-w-xl flex-wrap justify-center gap-6">
          {profiles.map(tile)}
          <div className="flex w-24 flex-col items-center gap-2 sm:w-28">
            <button
              onClick={openAdd}
              aria-label="Add profile"
              className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-white/[0.04] text-white transition hover:scale-105 hover:border-white hover:text-white sm:h-28 sm:w-28"
            >
              <Plus className="h-8 w-8 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            </button>
            <p className="text-sm text-white">Add</p>
          </div>
        </div>
      </div>

      {draft && <ProfileEditor profile={draft} onCancel={() => setDraft(null)} onSave={profile => {
        const existing = profiles.some(p => p.id === profile.id);
        commit(existing ? profiles.map(p => p.id === profile.id ? profile : p) : insertBeforeKids(profiles, profile));
        setDraft(null);
        if (!existing) { saveActiveProfile(profile.id); onPick(profile.id); }
      }} />}
    </div>
  );
}
