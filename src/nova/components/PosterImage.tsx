import { useEffect, useRef, useState } from 'react';
import { optimizePosterUrl } from '@/nova/tv-spatial-nav';

type PosterImageProps = {
  src?: string | undefined;
  alt: string;
  width?: number;
  eager?: boolean;
  className?: string;
};

/**
 * Lightweight Smart TV poster image:
 * - Upgrades remote CDN URLs to compact WebP sizing
 * - Uses IntersectionObserver + native lazy loading & async decoding so off-screen
 *   posters do not inflate 1 GB Smart TV GPU/texture memory
 */
export default function PosterImage({
  src,
  alt,
  width = 480,
  eager = false,
  className = 'h-full w-full object-cover',
}: PosterImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (eager || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 240px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, eager]);

  if (!src || failed) {
    return null;
  }

  const optimized = optimizePosterUrl(src, width);

  return (
    <img
      ref={imgRef}
      src={shouldLoad ? optimized : undefined}
      data-src={optimized}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
