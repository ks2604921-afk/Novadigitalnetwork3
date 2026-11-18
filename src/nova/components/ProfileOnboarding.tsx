import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvatarArt from '@/nova/components/AvatarArt';
import Logo from '@/nova/components/Logo';
import { APP_LANGUAGES } from '@/nova/languages';
import { PROFILE_AVATARS, PROFILE_GRADS } from '@/nova/profile-rules';

const LANGS = APP_LANGUAGES;
export const ONBOARDING_BUFFER_MS = 900;

export default function ProfileOnboarding({
  avatar = PROFILE_AVATARS[0],
  grad = PROFILE_GRADS[0],
  kid = false,
  onDone,
  initialLanguages = [],
  onCancel,
}: {
  name?: string | undefined;
  avatar?: string | undefined;
  grad?: string | undefined;
  kid?: boolean | undefined;
  onDone: (langs: string[]) => void;
  initialLanguages?: string[] | undefined;
  onCancel?: (() => void) | undefined;
}) {
  const [step, setStep] = useState<'lang' | 'welcome'>('lang');
  const [sel, setSel] = useState<string[]>(initialLanguages);
  const [buffering, setBuffering] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleGetStarted = () => {
    if (buffering) return;
    setBuffering(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onDone(sel);
    }, ONBOARDING_BUFFER_MS);
  };

  const content = step === 'welcome' ? (
    <div role="dialog" aria-label="Profile preferences" className="nova-onboarding-fourcolor fixed inset-0 z-[210] flex flex-col justify-center overflow-hidden bg-[#050509] text-white">
      <Button variant="novaAction" aria-label="Back to languages" disabled={buffering} onClick={() => setStep('lang')} className="absolute left-5 top-5 z-10 text-white disabled:pointer-events-none disabled:opacity-40">
        <ChevronLeft className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />Back
      </Button>
      <div className="relative px-6 py-14 text-center">
        <div className="mb-4 flex justify-center"><Logo /></div>
        <div className="mb-5 flex justify-center">
          <div
            data-testid="onboarding-profile-avatar"
            className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${grad} text-4xl shadow-[0_0_28px_rgba(236,72,153,0.38)] ring-2 ring-white/80 sm:h-24 sm:w-24`}
          >
            <AvatarArt avatar={avatar} kid={kid} />
          </div>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Welcome to NOVA</h1>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {sel.map((l) => <span key={l} className="nova-pill rounded-full px-3 py-1 text-xs font-semibold text-white">{l}</span>)}
        </div>
        <Button variant="novaAction" disabled={buffering} onClick={handleGetStarted} className="nova-pill-solid mx-auto mt-8 block h-12 w-full max-w-sm rounded-full text-lg font-bold text-white disabled:pointer-events-none disabled:opacity-60">
          Get Started
        </Button>
      </div>
      {buffering && (
        <div
          data-testid="onboarding-buffering"
          role="status"
          aria-label="Loading NOVA"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px]"
        >
          <div
            data-testid="onboarding-spinner"
            className="h-11 w-11 animate-spin rounded-full border-[4px] border-transparent border-t-[#ff47a3] border-r-[#a855f7] bg-transparent drop-shadow-[0_0_18px_rgba(255,71,163,0.95)]"
          />
        </div>
      )}
    </div>
  ) : (
    <div role="dialog" aria-label="Profile preferences" className="fixed inset-0 z-[210] overflow-y-auto bg-nova-black px-5 pb-32 pt-10 text-white">
      {onCancel && <Button variant="novaAction" onClick={onCancel} className="mb-4 text-white"><ChevronLeft className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />Back</Button>}
      <h1 className="text-2xl font-black text-white sm:text-3xl">What do you like to watch in?</h1>
      <p className="mt-1 text-sm text-white">Select your languages — we'll customize your home feed.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {LANGS.map((l) => {
          const on = sel.includes(l.id);
          return (
            <Button variant="novaAction" key={l.id} onClick={() => toggle(l.id)} aria-label={l.id} aria-pressed={on}
              className={`relative aspect-[4/3] h-auto overflow-hidden rounded-lg bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-nova-dark text-left transition ${on ? 'ring-2 ring-nova-accent scale-[1.02]' : 'ring-1 ring-white/20'}`}>
              <div className="absolute bottom-3 left-3">
                <p className="text-xl font-black text-white">{l.script}</p>
                <p className="text-xs text-white/95">{l.id}</p>
              </div>
              {on && <span className="nova-pill-solid absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full"><Check className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /></span>}
            </Button>
          );
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-nova-black to-transparent p-5">
        <Button variant="novaAction" disabled={!sel.length} onClick={() => setStep('welcome')} className="nova-pill-solid mx-auto block h-12 w-full max-w-sm rounded-full font-bold text-white disabled:opacity-40">
          Continue
        </Button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
