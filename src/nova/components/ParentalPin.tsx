import { useEffect, useState } from 'react';
import { ArrowLeft, Delete, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { onCancel: () => void; onSave: (pin: string) => void };

export default function ParentalPin({ onCancel, onSave }: Props) {
  const [pin, setPin] = useState('');
  const addDigit = (digit: string) => setPin((value) => (value + digit).slice(0, 4));

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) setPin((value) => (value + event.key).slice(0, 4));
      if (event.key === 'Backspace') setPin((value) => value.slice(0, -1));
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0f1219]/[0.92] px-5 py-8">
      <section role="dialog" aria-modal="true" aria-labelledby="pin-title" className="w-full max-w-sm rounded-lg border border-nova-line bg-nova-dark p-6 text-nova-text sm:p-8">
        <Button variant="ghost" size="icon" aria-label="Cancel PIN setup" onClick={onCancel} autoFocus className="mb-5 text-nova-muted hover:bg-nova-card hover:text-nova-text"><ArrowLeft /></Button>
        <LockKeyhole className="mx-auto mb-4 h-7 w-7 text-nova-muted" strokeWidth={1.5} />
        <h2 id="pin-title" className="text-center text-2xl font-semibold">Create your PIN</h2>
        <p className="mt-2 text-center text-sm text-nova-muted">Parental Controls</p>
        <div aria-label={`${pin.length} of 4 PIN digits entered`} className="my-8 grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((index) => <div key={index} className={`flex h-16 items-center justify-center rounded-md border bg-nova-card ${index === pin.length ? 'border-nova-text' : 'border-nova-line'}`}><span className="text-2xl">{index < pin.length ? '●' : ''}</span></div>)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => <Button key={digit} variant="ghost" onClick={() => addDigit(digit)} className="h-14 bg-nova-card text-xl font-medium hover:bg-nova-line">{digit}</Button>)}
          <div />
          <Button variant="ghost" onClick={() => addDigit('0')} className="h-14 bg-nova-card text-xl font-medium hover:bg-nova-line">0</Button>
          <Button variant="ghost" aria-label="Erase last digit" title="Erase last digit" onClick={() => setPin((value) => value.slice(0, -1))} className="h-14 text-nova-muted hover:bg-nova-card"><Delete /></Button>
        </div>
        <Button disabled={pin.length !== 4} onClick={() => onSave(pin)} className="mt-6 h-12 w-full bg-nova-text font-semibold text-nova-black hover:bg-nova-text/90">OK</Button>
      </section>
    </div>
  );
}