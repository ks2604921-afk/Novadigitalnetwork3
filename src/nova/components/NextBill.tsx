import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function NextBill({ trial }: { trial: boolean }) {
  const [cancelled, setCancelled] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const date = addDays(trial ? 30 : 24);

  return (
    <div className="mt-4 rounded-2xl border border-nova-line bg-nova-black p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-nova-red/15">
            <CalendarDays className="h-5 w-5 text-nova-accent" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-nova-muted">
              {cancelled ? 'Access until' : 'Next bill on'}
            </p>
            <p className="text-sm font-semibold text-nova-text">{date}</p>
          </div>
        </div>
        {cancelled ? (
          <span className="nova-pill rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-nova-muted">
            AutoPay cancelled
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="nova-pill rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-nova-text transition hover:brightness-125"
          >
            Cancel AutoPay
          </button>
        )}
      </div>
      {confirming && !cancelled && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-nova-text/5 p-3">
          <p className="text-xs text-nova-muted">Stop automatic renewal?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-nova-muted hover:text-nova-text"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={() => {
                setCancelled(true);
                setConfirming(false);
              }}
              className="nova-pill-solid rounded-full px-3 py-1.5 text-xs font-semibold text-nova-text"
            >
              Yes, cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
