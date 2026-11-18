import { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import Logo from '@/nova/components/Logo';
import { SAMPLE_OTP } from '@/nova/components/SampleLogin';

/**
 * Desktop login box. Sample mode: OTP 1234.
 * Without `onClose` it is a required full-screen login gate (TV/desktop must log in before using the app).
 */
export default function DesktopLogin({
  onClose,
  onDone,
  onSwitchToTv,
}: {
  onClose?: (() => void) | undefined;
  onDone: () => void;
  onSwitchToTv?: (() => void) | undefined;
}) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const value = step === 'phone' ? phone : otp;
  const len = step === 'phone' ? 10 : 4;
  const setValue = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, len);
    if (step === 'phone') setPhone(clean);
    else setOtp(clean);
  };

  const submit = () => {
    if (step === 'phone') {
      if (phone.length !== 10) return;
      setNote('');
      setStep('otp');
      return;
    }
    if (otp !== SAMPLE_OTP) {
      setNote(`Wrong OTP. Sample OTP is ${SAMPLE_OTP}`);
      setOtp('');
      return;
    }
    onDone();
  };

  return (
    <div
      className={`fixed inset-0 z-[140] flex items-center justify-center p-6 ${onClose ? 'bg-[#0f1219]/[0.92]' : 'bg-nova-black'}`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Login"
        onClick={(e) => e.stopPropagation()}
        className="nova-login-pop relative w-full max-w-[460px] overflow-hidden rounded-3xl border border-white/10 bg-nova-dark px-8 py-10 shadow-[0_40px_120px_-30px_rgba(124,58,237,0.45)] sm:px-10"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.28),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.14),transparent_70%)]" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full text-nova-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        <div className="relative mb-8 flex justify-center">
          <Logo />
        </div>

        <form
          className="relative flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex gap-3">
            {step === 'phone' && (
              <div className="grid h-14 w-[72px] shrink-0 place-items-center rounded-xl border border-white/10 text-nova-muted">
                +91
              </div>
            )}
            <fieldset className="relative flex h-14 flex-1 items-center rounded-xl border border-white/25 px-4 transition-colors focus-within:border-white/50">
              <legend className="-ml-1 px-1 text-xs font-medium text-nova-muted">
                {step === 'phone' ? 'Enter mobile number' : `Enter OTP sent to +91 ${phone}`}
              </legend>
              <input
                autoFocus
                key={step}
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={step === 'phone' ? '' : '• • • •'}
                aria-label={step === 'phone' ? 'Mobile number' : 'OTP'}
                className="-mt-2 w-full bg-transparent text-lg font-semibold tracking-wider text-white outline-none placeholder:text-nova-muted focus:outline-none focus-visible:outline-none"
              />
            </fieldset>
          </div>

          {step === 'phone' ? (
            <p className="mt-3 text-sm leading-relaxed text-nova-muted">
              By proceeding you confirm that you are above 18 years of age and agree to the{' '}
              <span className="font-semibold text-white">Privacy Policy</span> &{' '}
              <span className="font-semibold text-white">Terms of Use</span>.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setNote('');
              }}
              className="mt-3 self-start text-sm text-nova-muted hover:text-white"
            >
              Change number
            </button>
          )}
          {note && <p className="mt-3 text-sm text-nova-muted">{note}</p>}

          <div className="mt-8">
            <div className="h-14">
              {value.length === len && (
                <button
                  type="submit"
                  className="nova-pill-solid flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white"
                >
                  {step === 'phone' ? 'Get OTP' : 'Verify & Continue'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="mt-4 text-center text-sm text-nova-muted">
              Having trouble logging in?{' '}
              <button
                type="button"
                onClick={() => setNote(`Sample mode: any 10-digit number works, OTP is ${SAMPLE_OTP}.`)}
                className="font-semibold text-white hover:underline"
              >
                Get Help
              </button>
            </p>
            {onSwitchToTv && (
              <p className="mt-2 text-center text-xs text-nova-muted">
                Using a Smart TV?{' '}
                <button
                  type="button"
                  onClick={onSwitchToTv}
                  className="font-semibold text-nova-accent hover:underline"
                >
                  Open TV Login
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
