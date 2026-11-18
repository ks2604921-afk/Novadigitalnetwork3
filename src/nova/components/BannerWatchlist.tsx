import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BannerWatchlist({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const read = () => {
      try { setSaved(localStorage.getItem(`nova-watchlist:${title}`) === 'true'); } catch { setSaved(false); }
    };
    read();
    window.addEventListener('storage', read);
    window.addEventListener('focus', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('focus', read); };
  }, [title]);

  const label = saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`;
  return <div className="relative flex shrink-0 flex-col items-center">
    <Button variant="novaAction" size="icon" aria-label={label} title={saved ? 'Saved Watchlist' : 'Watchlist'} aria-pressed={saved}
      data-tv-focusable="true"
      className="tv-focusable nova-pill h-12 w-12 shrink-0 rounded-full border border-nova-line text-nova-text [&_svg]:size-5"
      onClick={() => {
        try {
          localStorage.setItem(`nova-watchlist:${title}`, String(!saved));
          setSaved(!saved);
          setError('');
        } catch { setError('Could not save watchlist. Please try again.'); }
      }}>
      {saved ? <Check /> : <Plus />}
    </Button>
    {saved && <span role="status" className="absolute top-full mt-1 whitespace-nowrap text-[10px] font-medium text-nova-text">Saved Watchlist</span>}
    {error && <span role="alert" className="text-xs text-nova-muted">{error}</span>}
  </div>;
}