import { useEffect, useRef, useState } from 'react';
import { ChevronRight, MessageSquare, Pencil, PhoneCall } from 'lucide-react';
import Logo from '@/nova/components/Logo';
import Keypad from '@/nova/components/Keypad';
import { SAMPLE_OTP } from '@/nova/components/SampleLogin';

/**
 * Centered login screen with keypad for NOVA.
 * Sample mode: any 10-digit number + OTP 1234 continues.
 */
export const OTP_BUFFER_MS = 1_500;
export const OTP_RESEND_SECONDS = 30;
export const STATUS_NOTE_MS = 3_000;

export default function TvLogin({ onDone }: { onDone: (phone?: string) => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_SECONDS);
  const [buffering, setBuffering] = useState<'send' | 'verify' | null>(null);

  const timerRef = useRef<number | null>(null);
  const stateRef = useRef({ step, phone, otp, buffering, resendSeconds, onDone });
  stateRef.current = { step, phone, otp, buffering, resendSeconds, onDone };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== 'otp' || resendSeconds <= 0) return;
    const t = window.setTimeout(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [step, resendSeconds]);

  useEffect(() => {
    if (!statusNote) return;
    const t = window.setTimeout(() => setStatusNote(''), STATUS_NOTE_MS);
    return () => window.clearTimeout(t);
  }, [statusNote]);

  const value = step === 'phone' ? phone : otp;
  const len = step === 'phone' ? 10 : 4;

  const setValue = (next: string) => {
    if (stateRef.current.buffering !== null) return;
    const clean = next.replace(/\D/g, '').slice(0, len);
    setError('');
    if (step === 'phone') setPhone(clean);
    else setOtp(clean);
  };

  const sendOtp = () => {
    if (stateRef.current.buffering !== null) return;
    if (stateRef.current.phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setStatusNote('');
    setBuffering('send');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setBuffering(null);
      setOtp('');
      setResendSeconds(OTP_RESEND_SECONDS);
      setStep('otp');
    }, OTP_BUFFER_MS);
  };

  const resendVia = (channel: 'sms' | 'call') => {
    if (stateRef.current.buffering !== null || stateRef.current.resendSeconds > 0) return;
    setError('');
    setStatusNote('');
    setBuffering('send');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setBuffering(null);
      setResendSeconds(OTP_RESEND_SECONDS);
      const p = stateRef.current.phone;
      const masked = p.length >= 5 ? `${p.slice(0, 3)}xxxx${p.slice(-2)}` : p;
      setStatusNote(
        channel === 'sms'
          ? `OTP resent via SMS to +91 ${masked}`
          : `OTP verification call requested for +91 ${masked}`,
      );
    }, OTP_BUFFER_MS);
  };

  const verify = () => {
    if (stateRef.current.buffering !== null) return;
    if (stateRef.current.otp.length !== 4) return;
    setError('');
    setStatusNote('');
    setBuffering('verify');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setBuffering(null);
      if (stateRef.current.otp !== SAMPLE_OTP) {
        setError(`Wrong OTP. Sample OTP is ${SAMPLE_OTP}`);
        setOtp('');
        return;
      }
      stateRef.current.onDone(stateRef.current.phone);
    }, OTP_BUFFER_MS);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.getAttribute('data-tv-control') === 'secondary') return;
      const current = stateRef.current;
      if (current.buffering !== null) return;
      if (current.step === 'phone' && current.phone.length === 10) {
        e.preventDefault();
        sendOtp();
      } else if (current.step === 'otp' && current.otp.length === 4) {
        e.preventDefault();
        verify();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const formattedPhone = phone
    ? `${phone.slice(0, 5)}${phone.length > 5 ? ` ${phone.slice(5)}` : ''}`
    : '';
  const countdownText = `00:${String(resendSeconds).padStart(2, '0')}`;

  return (
    <div
      data-testid="tv-login-screen"
      className="fixed inset-0 z-[140] overflow-y-auto bg-nova-black text-white antialiased"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.22),transparent_60%)]" />

      <div className="relative flex min-h-full w-full flex-col items-center justify-center px-4 py-6 sm:px-6">
        <div className="mb-5 flex justify-center">
          <Logo size="xl" />
        </div>

        <div
          role="dialog"
          aria-modal="true"
          aria-label="NOVA Login"
          className="w-full max-w-[400px] rounded-3xl border border-white/[0.12] bg-[#0f1219]/[0.92] p-5 shadow-[0_28px_90px_-24px_rgba(124,58,237,0.42),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6"
        >
          {step === 'phone' ? (
            <>
              <p className="mb-4 text-center text-sm font-medium text-white">
                Log in with your mobile number
              </p>
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.16] bg-black/45 px-4 py-3.5 transition focus-within:border-nova-accent/80">
                <span className="shrink-0 border-r border-white/20 pr-3 text-sm font-bold text-white">
                  +91
                </span>
                <div
                  aria-label="Mobile number"
                  data-testid="tv-login-phone"
                  className="min-w-0 flex-1 text-lg font-semibold tracking-widest text-white"
                >
                  {formattedPhone || <span className="text-sm font-normal tracking-normal text-white/80">Mobile number</span>}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-white">Enter OTP</h2>
                <div className="flex flex-wrap items-center justify-center gap-2 text-base text-white/90">
                  <span>
                    Sent to <span className="font-semibold tracking-wide text-white">+91 {phone}</span>
                  </span>
                  <button
                    type="button"
                    data-tv-control="secondary"
                    aria-label="Edit mobile number"
                    disabled={buffering !== null}
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setError('');
                      setStatusNote('');
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-white transition hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.85)] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Pencil className="h-4 w-4 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
              <div aria-label="OTP" data-testid="tv-login-otp" className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex h-12 items-center justify-center rounded-xl border bg-nova-black/75 text-xl font-bold transition ${
                      i === otp.length
                        ? 'border-nova-accent ring-1 ring-nova-accent/50 text-white'
                        : otp[i]
                          ? 'border-white/30 text-white'
                          : 'border-white/12 text-white'
                    }`}
                  >
                    {otp[i] ? '●' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 text-center text-xs font-medium text-rose-400">
              {error}
            </p>
          )}
          {!error && statusNote && (
            <p role="status" className="mt-3 text-center text-xs font-medium text-emerald-300">
              {statusNote}
            </p>
          )}

          <div className="mt-4">
            <Keypad
              value={value}
              length={len}
              onChange={setValue}
              hideDots
            />
          </div>

          {step === 'otp' && (
            <div className="mt-4 space-y-2.5 text-center">
              <p
                data-testid="tv-login-resend-timer"
                className="text-sm font-medium tabular-nums text-white/80"
              >
                {resendSeconds > 0 ? `Resend in ${countdownText}` : 'Resend OTP via'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  data-tv-control="secondary"
                  data-testid="tv-login-resend-sms"
                  disabled={resendSeconds > 0 || buffering !== null}
                  onClick={() => resendVia('sms')}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.12] disabled:pointer-events-none disabled:opacity-40"
                >
                  <MessageSquare className="h-4 w-4 text-white" />
                  <span>SMS</span>
                </button>
                <button
                  type="button"
                  data-tv-control="secondary"
                  data-testid="tv-login-resend-call"
                  disabled={resendSeconds > 0 || buffering !== null}
                  onClick={() => resendVia('call')}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.12] disabled:pointer-events-none disabled:opacity-40"
                >
                  <PhoneCall className="h-4 w-4 text-white" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={value.length < len || buffering !== null}
            onClick={step === 'phone' ? sendOtp : verify}
            className="nova-pill-solid mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-[0_12px_32px_-8px_rgba(236,72,153,0.4)] transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
          >
            <span>{step === 'phone' ? 'Get OTP' : 'Verify & Continue'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {buffering !== null && (
        <div
          data-testid="tv-login-buffering"
          role="status"
          aria-label={buffering === 'verify' ? 'Verifying OTP' : 'Sending OTP'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
        >
          <div
            data-testid="tv-login-spinner"
            className="h-10 w-10 animate-spin rounded-full border-[4px] border-transparent border-t-[#ff47a3] border-r-[#a855f7] bg-transparent drop-shadow-[0_0_18px_rgba(255,71,163,0.95)]"
          />
        </div>
      )}
    </div>
  );
}
