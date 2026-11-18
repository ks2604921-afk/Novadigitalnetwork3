import { useEffect, useState } from 'react';
import { Check, Download, Heart, LoaderCircle, Plus, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { title: string; source: string };

const previewHooks: Record<string, string> = {
  'Demon Slayer': 'Himmat ki kahani, har mod par ek nayi jung.',
  'Neon Dreams': 'Roshni ke shehar mein, raaz kabhi nahi sote.',
  'Shadow Protocol': 'Ek mission. Har mod par naya khatra.',
  'Crimson Veil': 'Har chehre ke peeche ek chhupa raaz.',
  'Barcode': 'Har nishaan ek nayi kahani kehta hai.',
};

export default function PlayerActions({ title, source }: Props) {
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState('');
  const [rateOpen, setRateOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(`nova-watchlist:${title}`) === 'true');
      setRating(localStorage.getItem(`nova-rating:${title}`) ?? '');
    } catch { /* Storage may be disabled. */ }
  }, [title]);

  const toggleWatchlist = () => {
    try {
      localStorage.setItem(`nova-watchlist:${title}`, String(!saved));
      setSaved(!saved);
      setMessage('');
    } catch { setMessage('Watchlist could not be saved. Please try again.'); }
  };

  const rate = (value: string) => {
    const next = rating === value ? '' : value;
    try { if (next) localStorage.setItem(`nova-rating:${title}`, next); else localStorage.removeItem(`nova-rating:${title}`); } catch { /* Storage may be disabled. */ }
    setRating(next);
    setRateOpen(false);
    if (next) { setThanks(true); window.setTimeout(() => setThanks(false), 2500); }
  };
  const RATES = [
    { id: 'bad', label: 'Not for me', Icon: ThumbsDown, color: 'text-nova-dislike', fill: 'fill-nova-dislike' },
    { id: 'like', label: 'I like this', Icon: ThumbsUp, color: 'text-nova-accent', fill: 'fill-nova-accent' },
    { id: 'love', label: 'Love this!', Icon: Heart, color: 'text-nova-heart', fill: 'fill-nova-heart' },
  ] as const;
  const current = RATES.find(r => r.id === rating);

  const download = async () => {
    setDownloading(true);
    setMessage('');
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error('Download failed');
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${title.replace(/[^a-z0-9 -]/gi, '').trim() || 'NOVA-video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch { setMessage('Download failed. Please try again.'); }
    finally { setDownloading(false); }
  };

  const share = async () => {
    const url = new URL('/', window.location.origin);
    url.searchParams.set('watch', title);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} — NOVA`, url: url.href });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.href);
        setMessage('Link copied');
      } else {
        setShareLink(url.href);
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setShareLink(url.href);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-8">
      <div className="px-1 pb-1 pt-3 text-left sm:pt-4">
        <h1 className="break-words text-base font-semibold leading-snug text-nova-text sm:text-2xl">{title}</h1>
        <p className="mt-1 text-[11px] leading-relaxed text-nova-muted sm:text-xs">{previewHooks[title] ?? 'Ek nayi kahani, ek naya safar.'}</p>
      </div>
      <div className="flex items-center justify-start gap-5 px-1 border-b border-nova-line py-2 sm:py-3">
        <Button variant="novaAction" onClick={toggleWatchlist} aria-label="Watchlist" aria-pressed={saved} className="h-12 min-w-0 flex-col gap-1 px-1 text-[8px] sm:text-[10px] [&_svg]:size-4">
          {saved ? <Check /> : <Plus />}<span>{saved ? 'Saved Watchlist' : 'Watchlist'}</span>
        </Button>
        <Button variant="novaAction" aria-label="Download" onClick={download} disabled={downloading} className="h-12 min-w-0 flex-col gap-1 px-1 text-[8px] sm:text-[10px] [&_svg]:size-4">
          {downloading ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Download />}<span>Download</span>
        </Button>
        <Button variant="novaAction" onClick={share} className="h-12 min-w-0 flex-col gap-1 px-1 text-[8px] sm:text-[10px] [&_svg]:size-4"><Share2 /><span>Share</span></Button>
        <div className="relative" onMouseEnter={() => setRateOpen(true)} onMouseLeave={() => setRateOpen(false)}>
          <Button variant="novaAction" onClick={() => setRateOpen(!rateOpen)} aria-label="Rate" aria-expanded={rateOpen} aria-pressed={!!rating} className="h-12 min-w-0 flex-col gap-1 px-1 text-[8px] sm:text-[10px] [&_svg]:size-4">
            <Heart key={rating} className={rating ? 'nova-heart-pop !size-6 fill-nova-heart text-nova-heart' : 'text-nova-heart'} /><span>{current ? current.label : 'Rate'}</span>
          </Button>
          {rateOpen && <div role="group" aria-label="Rate this title" className="nova-ai-panel absolute bottom-full left-1/2 z-20 mb-1 flex -translate-x-1/2 gap-1 rounded-2xl border border-nova-line bg-nova-overlay p-1 shadow-xl">
            {RATES.map(({ id, label, Icon, color, fill }) => <Button key={id} variant="novaPlayer" aria-label={label} title={label} aria-pressed={rating === id} onClick={() => rate(id)} className={`h-14 w-16 flex-col gap-1 rounded-xl px-1 text-[9px] font-semibold transition-transform hover:scale-105 [&_svg]:size-5 ${rating === id ? 'bg-nova-text/10' : ''}`}><Icon className={`${color} ${rating === id ? fill : ''}`} /><span aria-hidden>{label}</span></Button>)}
          </div>}
        </div>
      </div>
      {thanks && <div role="status" className="nova-pill fixed inset-x-0 bottom-4 z-[130] mx-auto w-max rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-nova-text shadow-xl">Thanks for your feedback</div>}
      <p role="status" className={message ? 'mt-2 text-[11px] text-nova-accent' : 'sr-only'}>{message}</p>
      {shareLink && <input aria-label="Share link" readOnly value={shareLink} onFocus={event => event.currentTarget.select()} className="mt-2 w-full rounded-md border border-nova-line bg-nova-dark p-3 text-sm text-nova-text" />}
    </div>
  );
}