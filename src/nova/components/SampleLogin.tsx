import { useEffect, useState } from 'react';
import Logo from '@/nova/components/Logo';
import Keypad from '@/nova/components/Keypad';
import { shouldShowKeypad } from '@/nova/watching-profile-rules';

// Sample login: no SMS is sent. Any 10-digit number + OTP 1234 continues.
export const SAMPLE_OTP = '1234';

export default function SampleLogin({ onDone }: { onDone: (phone?: string) => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [tvScreen, setTvScreen] = useState(false);

  // Number keypad only on TV screens (remote control); phones & desktops type normally.
  useEffect(() => {
    setTvScreen(shouldShowKeypad(navigator.userAgent));
  }, []);

  const sendOtp = () => {
    if (phone.length !== 10) return setError('Enter a valid 10-digit mobile number');
    setError('');
    setStep('otp');
  };
  const verify = () => {
    if (otp !== SAMPLE_OTP) {
      setError('Wrong OTP. Sample OTP is 1234');
      setOtp('');
      return;
    }
    onDone(phone);
  };

  const value = step === 'phone' ? phone : otp;
  const len = step === 'phone' ? 10 : 4;
  const setValue = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, len);
    if (step === 'phone') setPhone(clean);
    else setOtp(clean);
  };

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-nova-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.35),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-10 flex justify-center"><Logo /></div>
        <h1 className="text-3xl font-extrabold text-white">
          {step === 'phone' ? 'Login to NOVA' : 'Enter OTP'}
        </h1>
        <p className="mt-2 text-sm text-nova-muted">
          {step === 'phone'
            ? 'Enter your mobile number to continue'
            : `Sample mode — use OTP ${SAMPLE_OTP} for +91 ${phone}`}
        </p>

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 'phone') sendOtp();
            else verify();
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1219]/[0.92] px-4 py-4">
            {step === 'phone' && <span className="font-semibold text-white">+91</span>}
            <input
              inputMode="numeric"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={step === 'phone' ? 'Mobile number' : '• • • •'}
              className="w-full bg-transparent text-lg tracking-widest text-white outline-none focus:outline-none focus-visible:outline-none placeholder:text-nova-muted"
              aria-label={step === 'phone' ? 'Mobile number' : 'OTP'}
            />
          </div>
          {error && <p className="mt-3 text-sm text-nova-muted">{error}</p>}

          {tvScreen && (
            <div className="mt-6">
              <Keypad value={value} length={len} onChange={setValue} hideDots />
            </div>
          )}

          {value.length === len && (
            <button type="submit" className="nova-pill-solid mt-6 w-full rounded-full py-4 text-base font-bold text-white">
              {step === 'phone' ? 'Get OTP' : 'Verify & Continue'}
            </button>
          )}
          {step === 'otp' && (
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="mt-4 w-full text-sm text-nova-muted hover:text-white"
            >
              Change number
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
