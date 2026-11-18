import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Welcome from '@/nova/components/Welcome';
import PhoneEntry from '@/nova/components/PhoneEntry';
import OtpVerify from '@/nova/components/OtpVerify';

type Step = 'welcome' | 'phone' | 'otp';

export default function AuthFlow() {
  const auth = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [phone, setPhone] = useState('');
  const [showOtpHint, setShowOtpHint] = useState(false);

  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const handlePhoneSuccess = (enteredPhone: string, otp?: string) => {
    setPhone(enteredPhone);
    setDemoOtp(otp ?? null);
    setShowOtpHint(true);
    setStep('otp');
  };

  const handleResend = async () => {
    if (!phone) return;
    const { otp } = await auth.requestOtp(phone);
    setDemoOtp(otp ?? null);
    setShowOtpHint(true);
  };

  const handleVerified = () => {
    // Session is already persisted by verifyOtp; App switches to the main view.
    setShowOtpHint(false);
  };

  return (
    <div className="min-h-screen bg-nova-black text-white">
      {step === 'welcome' && (
        <Welcome
          onSignUp={() => setStep('phone')}
          onLogin={() => setStep('phone')}
        />
      )}
      {step === 'phone' && (
        <PhoneEntry
          onSuccess={handlePhoneSuccess}
          onBack={() => setStep('welcome')}
        />
      )}
      {step === 'otp' && (
        <OtpVerify
          phone={phone}
          onVerified={handleVerified}
          onBack={() => setStep('phone')}
          onResend={handleResend}
        />
      )}
      {showOtpHint && step === 'otp' && demoOtp && (
        <DemoOtpNotice code={demoOtp} onClose={() => setShowOtpHint(false)} />
      )}
    </div>
  );
}

function DemoOtpNotice({ code, onClose }: { code: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-nova-line bg-nova-card px-4 py-2 text-xs text-nova-muted shadow-lg">
      Demo code: <span className="font-semibold tracking-widest text-nova-text">{code}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 font-medium text-nova-red hover:underline"
      >
        Got it
      </button>
    </div>
  );
}
