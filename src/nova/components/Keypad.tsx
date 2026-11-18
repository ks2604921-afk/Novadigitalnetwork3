import { useCallback, useEffect, useRef } from 'react';
import { Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  value: string;
  length: number;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  hideDots?: boolean;
};

export default function Keypad({ value, length, onChange, onSubmit, hideDots }: Props) {
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const addDigit = useCallback((d: string) => {
    if (valueRef.current.length >= length) return;
    const next = valueRef.current + d;
    valueRef.current = next;
    onChangeRef.current(next);
    if (next.length === length && submitRef.current) {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        submitRef.current?.();
      }, 80);
    }
  }, [length]);

  const eraseDigit = useCallback(() => {
    const next = valueRef.current.slice(0, -1);
    valueRef.current = next;
    onChangeRef.current(next);
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) addDigit(e.key);
      else if (e.key === 'Backspace') eraseDigit();
      else if (e.key === 'Enter' && valueRef.current.length === length && submitRef.current) {
        submitRef.current();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [addDigit, eraseDigit, length]);

  return (
    <div>
      {hideDots ? null : (
        <div aria-label={`${value.length} of ${length} entered`} className="my-8 grid grid-cols-4 gap-3">
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              className={`flex h-14 items-center justify-center rounded-md border bg-nova-card ${
                i === value.length ? 'border-nova-text' : 'border-nova-line'
              }`}
            >
              <span className="text-xl">{i < value.length ? '●' : ''}</span>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <Button
            key={d}
            type="button"
            variant="ghost"
            onClick={() => addDigit(d)}
            className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.05] text-xl font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.11] hover:text-white"
          >
            {d}
          </Button>
        ))}
        <div />
        <Button
          key="0"
          type="button"
          variant="ghost"
          onClick={() => addDigit('0')}
          className="h-14 rounded-xl border border-white/[0.08] bg-white/[0.05] text-xl font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.11] hover:text-white"
        >
          0
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Erase last digit"
          onClick={eraseDigit}
          className="h-14 rounded-xl border border-transparent text-white transition hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
        >
          <Delete className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
        </Button>
      </div>
    </div>
  );
}
