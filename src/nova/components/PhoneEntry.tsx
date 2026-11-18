import { useState } from 'react';
import { ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import Logo from '@/nova/components/Logo';

type Props = {
  onSuccess: (phone: string, otp?: string) => void;
  onBack: () => void;
};

const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

export default function PhoneEntry({ onSuccess, onBack }: Props) {
  const auth = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const normalized = phone.trim();
    if (!PHONE_RE.test(normalized)) {
      setError('Enter your mobile number with the country code (e.g. +919876543210).');
      return;
    }
    setLoading(true);
    try {
      const { otp } = await auth.requestOtp(normalized);
      setDemoOtp(otp ?? null);
      onSuccess(normalized, otp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP.');
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
        <h1 className="text-center text-2xl font-semibold">Enter mobile number</h1>
        <p className="mt-2 text-center text-sm text-nova-muted">
          We'll send a 6-digit verification code to this number.
        </p>
        <div className="mt-6 space-y-3">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-nova-muted" />
            <Input
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 pl-10 bg-nova-card border-nova-line text-base"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {demoOtp && (
            <p className="rounded-md border border-nova-line bg-nova-card px-3 py-2 text-center text-sm text-nova-muted">
              Demo code: <span className="font-semibold tracking-widest text-white">{demoOtp}</span>
            </p>
          )}
        </div>
        <Button
          onClick={submit}
          disabled={loading || !phone.trim()}
          className="mt-6 h-12 w-full bg-nova-red font-semibold text-white hover:bg-nova-red/90"
        >
          {loading ? 'Sending code…' : 'Send code'}
        </Button>
        <p className="mt-4 text-center text-xs text-nova-muted">
          By continuing you agree to NOVA's Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
