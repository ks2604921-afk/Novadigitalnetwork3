import type React from 'react';
import { useEffect, useRef, useState } from 'react';

type VirtualizedRowListProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string;
  estimateRowHeight?: number;
  overscan?: number;
  initialMountedCount?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  renderPlaceholder?: (item: T, index: number) => React.ReactNode;
};

/**
 * Lightweight vertical row virtualizer tuned for 1 GB RAM Smart TVs.
 * Keeps off-screen movie rows unmounted (rendered only as fixed-height lightweight
 * placeholders) while immediately mounting rows approaching the viewport or D-pad focus.
 */
export function VirtualizedRowList<T>({
  items,
  getKey,
  estimateRowHeight = 290,
  overscan = 2,
  initialMountedCount = 4,
  renderRow,
  renderPlaceholder,
}: VirtualizedRowListProps<T>) {
  const [visibleRange, setVisibleRange] = useState<[number, number]>(() => [
    0,
    Math.max(0, initialMountedCount - 1),
  ]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const visibleSetRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const onApproach = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number }>).detail;
      if (typeof detail?.index === 'number') {
        setFocusedIndex(detail.index);
      }
    };
    window.addEventListener('nova:tv-row-approach', onApproach);
    return () => window.removeEventListener('nova:tv-row-approach', onApproach);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const raw = (entry.target as HTMLElement).getAttribute('data-tv-row-index');
          const idx = raw ? Number(raw) : NaN;
          if (!Number.isFinite(idx)) continue;
          if (entry.isIntersecting) visibleSetRef.current.add(idx);
          else visibleSetRef.current.delete(idx);
        }
        if (visibleSetRef.current.size > 0) {
          const indices = Array.from(visibleSetRef.current);
          const min = Math.max(0, Math.min(...indices) - overscan);
          const max = Math.min(items.length - 1, Math.max(...indices) + overscan);
          setVisibleRange((prev) => (prev[0] === min && prev[1] === max ? prev : [min, max]));
        }
      },
      { rootMargin: '420px 0px' },
    );

    for (const node of slotRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [items.length, overscan]);

  return (
    <>
      {items.map((item, index) => {
        const inWindow = index >= visibleRange[0] && index <= visibleRange[1];
        const nearFocus =
          focusedIndex !== null && Math.abs(index - focusedIndex) <= overscan;
        const shouldMount = inWindow || nearFocus;

        return (
          <div
            key={getKey(item, index)}
            ref={(el) => {
              slotRefs.current[index] = el;
            }}
            data-tv-row-index={index}
            data-tv-row-mounted={shouldMount ? 'true' : 'false'}
            onFocusCapture={() => setFocusedIndex(index)}
            style={
              shouldMount
                ? { contain: 'layout style' }
                : { minHeight: `${estimateRowHeight}px`, contain: 'strict' }
            }
          >
            {shouldMount
              ? renderRow(item, index)
              : renderPlaceholder?.(item, index) ?? (
                  <div
                    aria-hidden="true"
                    className="mt-8 px-6 lg:px-12"
                    style={{ height: `${estimateRowHeight}px` }}
                  />
                )}
          </div>
        );
      })}
    </>
  );
}

type VirtualizedCardStripProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string;
  itemWidthPx: number;
  gapPx?: number;
  overscanCards?: number;
  virtualThreshold?: number;
  className?: string;
  renderCard: (item: T, index: number) => React.ReactNode;
};

/**
 * GPU-accelerated horizontal row strip (`will-change: transform`) that also
 * window-virtualizes large horizontal rows so off-screen cards consume minimal RAM.
 */
export function VirtualizedCardStrip<T>({
  items,
  getKey,
  itemWidthPx,
  gapPx = 16,
  overscanCards = 3,
  virtualThreshold = 9,
  className = '',
  renderCard,
}: VirtualizedCardStripProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<[number, number]>([0, Math.max(0, items.length - 1)]);
  const shouldVirtualize = items.length > virtualThreshold;

  useEffect(() => {
    if (!shouldVirtualize) {
      setRange([0, Math.max(0, items.length - 1)]);
      return;
    }

    const updateRange = () => {
      const el = scrollerRef.current;
      if (!el) return;
      const stride = Math.max(1, itemWidthPx + gapPx);
      const viewportWidth = el.clientWidth || 1280;
      const start = Math.max(0, Math.floor(el.scrollLeft / stride) - overscanCards);
      const visibleCount = Math.ceil(viewportWidth / stride);
      const end = Math.min(items.length - 1, start + visibleCount + overscanCards * 2);
      setRange((prev) => (prev[0] === start && prev[1] === end ? prev : [start, end]));
    };

    updateRange();
  }, [shouldVirtualize, items.length, itemWidthPx, gapPx, overscanCards]);

  if (!shouldVirtualize) {
    return (
      <div
        ref={scrollerRef}
        data-tv-row="true"
        className={`tv-scroll-row flex gap-4 overflow-x-auto scrollbar-hide pb-2 ${className}`}
      >
        {items.map((item, index) => renderCard(item, index))}
      </div>
    );
  }

  const stride = itemWidthPx + gapPx;
  const leftSpacer = range[0] * stride;
  const rightSpacer = Math.max(0, (items.length - 1 - range[1]) * stride);

  return (
    <div
      ref={scrollerRef}
      data-tv-row="true"
      onScroll={() => {
        const el = scrollerRef.current;
        if (!el) return;
        const viewportWidth = el.clientWidth || 1280;
        const start = Math.max(0, Math.floor(el.scrollLeft / stride) - overscanCards);
        const visibleCount = Math.ceil(viewportWidth / stride);
        const end = Math.min(items.length - 1, start + visibleCount + overscanCards * 2);
        setRange((prev) => (prev[0] === start && prev[1] === end ? prev : [start, end]));
      }}
      className={`tv-scroll-row flex gap-4 overflow-x-auto scrollbar-hide pb-2 ${className}`}
    >
      {leftSpacer > 0 && <div aria-hidden="true" style={{ width: `${leftSpacer}px`, flexShrink: 0 }} />}
      {items.slice(range[0], range[1] + 1).map((item, offset) => {
        const index = range[0] + offset;
        return <div key={getKey(item, index)} className="contents">{renderCard(item, index)}</div>;
      })}
      {rightSpacer > 0 && <div aria-hidden="true" style={{ width: `${rightSpacer}px`, flexShrink: 0 }} />}
    </div>
  );
}
