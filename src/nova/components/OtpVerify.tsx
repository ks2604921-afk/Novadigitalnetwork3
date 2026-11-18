import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import Logo from '@/nova/components/Logo';

type Props = {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
  onResend: () => void;
};

export default function OtpVerify({ phone, onVerified, onBack, onResend }: Props) {
  const auth = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(30);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (value?: string) => {
    const c = (value ?? code).trim();
    if (c.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await auth.verifyOtp(phone, c);
      onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-nova-black px-5 py-10">
      <div className="w-full max-w-sm rounded-xl border border-nova-line bg-nova-dark p-6 sm:p-8">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Go back"
          onClick={onBack}
          className="mb-5 text-nova-muted hover:bg-nova-card hover:text-nova-text"
        >
          <ArrowLeft />
        </Button>
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="text-center text-2xl font-semibold">Enter verification code</h1>
        <p className="mt-2 text-center text-sm text-nova-muted">
          Sent to <span className="font-medium text-white">{phone}</span>
        </p>
        <div className="mt-6">
          <Input
            ref={inputRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="•  •  •  •  •  •"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            className="h-14 text-center text-2xl tracking-[0.4em] bg-nova-card border-nova-line"
            onKeyDown={(e) => e.key === 'Enter' && verify()}
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
        <Button
          onClick={() => verify()}
          disabled={loading || code.length !== 6}
          className="mt-6 h-12 w-full bg-nova-red font-semibold text-white hover:bg-nova-red/90"
        >
          {loading ? 'Verifying…' : 'Verify code'}
        </Button>
        <div className="mt-4 text-center text-sm text-nova-muted">
          {seconds > 0 ? (
            <>Resend code in {seconds}s</>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="font-medium text-nova-red hover:underline"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
