import { useState } from 'react';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import Keypad from '@/nova/components/Keypad';
import Logo from '@/nova/components/Logo';

type Props = {
  phone: string;
  onDone: () => void;
  onBack: () => void;
};

export default function SetPin({ phone, onDone, onBack }: Props) {
  const auth = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (value: string) => {
    if (value.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      await auth.setPin(phone, value);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set PIN.');
      setPin('');
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
        <LockKeyhole className="mx-auto mb-4 h-7 w-7 text-nova-muted" strokeWidth={1.5} />
        <h1 className="text-center text-2xl font-semibold">Create your PIN</h1>
        <p className="mt-2 text-center text-sm text-nova-muted">
          Choose a 4-digit PIN to unlock NOVA on this phone.
        </p>
        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
        <Keypad
          value={loading ? '' : pin}
          length={4}
          onChange={setPin}
          onSubmit={() => save(pin)}
        />
        <Button
          disabled={loading || pin.length !== 4}
          onClick={() => save(pin)}
          className="mt-6 h-12 w-full bg-nova-text font-semibold text-nova-black hover:bg-nova-text/90"
        >
          {loading ? 'Saving…' : 'Save PIN'}
        </Button>
      </div>
    </div>
  );
}
