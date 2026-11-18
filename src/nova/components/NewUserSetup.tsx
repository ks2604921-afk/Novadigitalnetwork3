import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarArt from '@/nova/components/AvatarArt';
import Logo from '@/nova/components/Logo';
import { APP_LANGUAGES } from '@/nova/languages';
import { getAvatarLabel, PROFILE_AVATARS, PROFILE_GRADS } from '@/nova/profile-rules';

export type NewUserSetupResult = {
  name: string;
  avatar: string;
  languages: string[];
};

export default function NewUserSetup({
  onDone,
}: {
  onDone: (result: NewUserSetupResult) => void;
}) {
  const [step, setStep] = useState<'name' | 'avatar' | 'language' | 'ready'>('name');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(PROFILE_AVATARS[0]);
  const [languages, setLanguages] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'name') {
      nameInputRef.current?.focus({ preventScroll: true });
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'ready') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onDone({ name: name.trim(), avatar, languages });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, name, avatar, languages, onDone]);

  const toggleLang = (id: string) => {
    setLanguages((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const previewGrad = PROFILE_GRADS[0];

  const backTarget: 'name' | 'avatar' | 'language' | null =
    step === 'avatar' ? 'name' : step === 'language' ? 'avatar' : step === 'ready' ? 'language' : null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create your NOVA profile"
      data-testid="new-user-setup"
      className="fixed inset-0 z-[210] flex min-h-dvh w-screen flex-col overflow-y-auto bg-[#050507] text-white"
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(114,0,255,0.2),transparent_70%)]" />
        <div className="absolute -right-24 bottom-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,0,184,0.18),transparent_70%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 pt-8 sm:px-12 sm:pt-10">
        <div className="min-w-[84px]">
          {backTarget && (
            <Button
              type="button"
              variant="novaAction"
              aria-label={`Back to ${backTarget}`}
              onClick={() => setStep(backTarget)}
              className="gap-1.5 px-2 text-white hover:text-white"
            >
              <ChevronLeft className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              Back
            </Button>
          )}
        </div>
        <Logo size="lg" />
        <div className="min-w-[84px]" />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pb-14 pt-8 sm:px-10">
        {step === 'name' && (
          <form
            data-testid="new-user-step-name"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim()) setStep('avatar');
            }}
            className="mx-auto w-full max-w-md text-center"
          >
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              What&apos;s your name?
            </h1>
            <p className="mt-2 text-sm text-white/80 sm:text-base">
              Enter your name to personalize your NOVA profile.
            </p>
            <Input
              ref={nameInputRef}
              aria-label="Profile name"
              placeholder="Enter your name"
              maxLength={20}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-8 h-14 rounded-xl border-white/25 bg-white/[0.06] px-4 text-center text-lg font-semibold text-white placeholder:text-white/50 focus-visible:border-[#FF00B8] focus-visible:ring-[#FF00B8]/30"
            />
            <Button
              type="submit"
              disabled={!name.trim()}
              variant="novaAction"
              className="nova-pill-solid mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-base font-bold text-white disabled:opacity-40"
            >
              Continue
              <ChevronRight className="h-5 w-5" />
            </Button>
          </form>
        )}

        {step === 'avatar' && (
          <div data-testid="new-user-step-avatar" className="mx-auto w-full max-w-2xl text-center">
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Choose your avatar
            </h1>
            <p className="mt-2 text-sm text-white/80 sm:text-base">
              Pick a look for {name.trim()}&apos;s profile.
            </p>

            <div className="mt-6 flex flex-col items-center">
              <div
                className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${previewGrad} text-4xl shadow-[0_0_30px_rgba(255,0,184,0.35)] ring-2 ring-white/80 sm:h-28 sm:w-28`}
              >
                <AvatarArt avatar={avatar} />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-white">
                {getAvatarLabel(avatar)}
              </p>
            </div>

            <div
              role="group"
              aria-label="Choose avatar"
              className="mt-6 grid grid-cols-5 gap-3 sm:gap-4"
            >
              {PROFILE_AVATARS.map((av) => {
                const selected = avatar === av;
                const label = getAvatarLabel(av);
                return (
                  <button
                    key={av}
                    type="button"
                    aria-label={`Avatar ${label}`}
                    title={label}
                    aria-pressed={selected}
                    onClick={() => setAvatar(av)}
                    className={`group relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${previewGrad} text-2xl transition duration-200 hover:scale-105 sm:h-20 sm:w-20 ${
                      selected
                        ? 'scale-105 ring-2 ring-[#FF00B8] ring-offset-2 ring-offset-[#050507] shadow-[0_0_24px_rgba(255,0,184,0.5)]'
                        : 'ring-1 ring-white/25 hover:ring-white/60'
                    }`}
                  >
                    <AvatarArt avatar={av} />
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="novaAction"
              onClick={() => setStep('language')}
              className="nova-pill-solid mx-auto mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-lg text-base font-bold text-white"
            >
              Continue
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {step === 'language' && (
          <div data-testid="new-user-step-language" className="mx-auto w-full max-w-4xl">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-black text-white sm:text-3xl">
                What do you like to watch in?
              </h1>
              <p className="mt-1.5 text-sm text-white/85">
                Select your languages — we&apos;ll customize your home feed.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {APP_LANGUAGES.map((lang) => {
                const on = languages.includes(lang.id);
                return (
                  <Button
                    key={lang.id}
                    type="button"
                    variant="novaAction"
                    aria-label={lang.id}
                    aria-pressed={on}
                    onClick={() => toggleLang(lang.id)}
                    className={`relative aspect-[4/3] h-auto overflow-hidden rounded-lg bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-nova-dark text-left transition ${
                      on ? 'scale-[1.02] ring-2 ring-nova-accent' : 'ring-1 ring-white/20'
                    }`}
                  >
                    <div className="absolute bottom-3 left-3">
                      <p className="text-xl font-black text-white">{lang.script}</p>
                      <p className="text-xs text-white/95">{lang.id}</p>
                    </div>
                    {on && (
                      <span className="nova-pill-solid absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full">
                        <Check className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                variant="novaAction"
                disabled={!languages.length}
                onClick={() => setStep('ready')}
                className="nova-pill-solid inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-lg text-base font-bold text-white disabled:opacity-40"
              >
                Continue
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 'ready' && (
          <div
            data-testid="new-user-step-ready"
            className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-[#0f1219]/[0.92] px-6 py-10 text-center shadow-[0_30px_90px_rgba(114,0,255,0.35)] sm:px-10 sm:py-12"
          >
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.3),rgba(236,72,153,0.18)_45%,transparent_70%)]" />

            <div className="relative flex flex-col items-center">
              <div
                className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${previewGrad} text-5xl shadow-[0_0_40px_rgba(236,72,153,0.45)] ring-2 ring-white/85 sm:h-32 sm:w-32`}
              >
                <AvatarArt avatar={avatar} />
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.22em] text-[#ec4899]">
                {name.trim()}
              </p>

              <h1 className="mt-2 bg-gradient-to-r from-white via-white to-[#f5d0fe] bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                Welcome! Your profile is ready
              </h1>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="nova-pill rounded-full px-3.5 py-1 text-xs font-semibold text-white"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <Button
                type="button"
                variant="novaAction"
                onClick={() =>
                  onDone({
                    name: name.trim(),
                    avatar,
                    languages,
                  })
                }
                className="nova-pill-solid mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-lg text-base font-bold text-white"
              >
                Let&apos;s Begin
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
