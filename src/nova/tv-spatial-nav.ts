import { useEffect } from 'react';

export type SpatialDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Optimizes remote poster URLs (such as Pexels CDN assets) to lightweight WebP
 * resized to fit Smart TV card dimensions and conserve 1 GB TV memory.
 */
export function optimizePosterUrl(url: string, width = 480): string {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('images.pexels.com')) {
      parsed.searchParams.set('auto', 'compress');
      parsed.searchParams.set('cs', 'tinysrgb');
      parsed.searchParams.set('fm', 'webp');
      parsed.searchParams.set('w', String(width));
      if (parsed.searchParams.has('h')) {
        parsed.searchParams.set('h', String(Math.round(width * 0.65)));
      }
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function isElementVisible(el: HTMLElement): boolean {
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.getAttribute('aria-disabled') === 'true') return false;
  if (el.closest('[inert], [aria-hidden="true"]')) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') {
    return false;
  }
  return true;
}

export function getTvFocusables(root: ParentNode = document): HTMLElement[] {
  const raw = Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-tv-focusable="true"], nav a[href], nav button, main button, main a[href], aside button, [role="button"]',
    ),
  );
  const seen = new Set<HTMLElement>();
  const out: HTMLElement[] = [];
  for (const el of raw) {
    if (seen.has(el)) continue;
    seen.add(el);
    if (el.tabIndex === -1 && el.getAttribute('data-tv-focusable') !== 'true') continue;
    if (el.closest('[role="dialog"][aria-modal="true"]')) continue;
    if (!isElementVisible(el)) continue;
    out.push(el);
  }
  return out;
}

function hasGeometry(rect: DOMRect): boolean {
  return rect.width > 0 && rect.height > 0;
}

function findRowSequenceCandidate(
  current: HTMLElement,
  candidates: HTMLElement[],
  direction: SpatialDirection,
): HTMLElement | null {
  const currentRow = current.closest<HTMLElement>('[data-tv-row]');
  const currentRegion = current.closest<HTMLElement>('[data-tv-region]')?.getAttribute('data-tv-region');

  if (direction === 'left' || direction === 'right') {
    const scope = currentRow ? candidates.filter(c => currentRow.contains(c)) : candidates;
    const idx = scope.indexOf(current);
    if (idx !== -1) {
      const nextIdx = direction === 'right' ? idx + 1 : idx - 1;
      if (nextIdx >= 0 && nextIdx < scope.length) {
        return scope[nextIdx] ?? null;
      }
      if (direction === 'left' && currentRegion === 'main') {
        const railTarget = candidates.find(
          c => c.closest('[data-tv-region]')?.getAttribute('data-tv-region') === 'rail',
        );
        if (railTarget) return railTarget;
      }
      if (direction === 'right' && currentRegion === 'rail') {
        const mainTarget = candidates.find(
          c => c.closest('[data-tv-region]')?.getAttribute('data-tv-region') === 'main',
        );
        if (mainTarget) return mainTarget;
      }
    }
  }

  if (direction === 'up' || direction === 'down') {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-tv-row]'));
    if (currentRow && rows.length > 0) {
      const rIdx = rows.indexOf(currentRow);
      if (rIdx !== -1) {
        const step = direction === 'down' ? 1 : -1;
        for (let i = rIdx + step; i >= 0 && i < rows.length; i += step) {
          const targetRow = rows[i]!;
          const rowCandidates = candidates.filter(c => targetRow.contains(c));
          if (rowCandidates.length > 0) return rowCandidates[0] ?? null;
        }
      }
    }
  }

  const globalIdx = candidates.indexOf(current);
  if (globalIdx === -1) return candidates[0] ?? null;
  if (direction === 'down' || direction === 'right') {
    return candidates[(globalIdx + 1) % candidates.length] ?? null;
  }
  return candidates[(globalIdx - 1 + candidates.length) % candidates.length] ?? null;
}

/**
 * Computes the best spatial navigation candidate along the requested D-pad vector.
 * Falls back cleanly to semantic row traversal in headless/non-layout environments.
 */
export function findSpatialCandidate(
  current: HTMLElement | null,
  candidates: HTMLElement[],
  direction: SpatialDirection,
): HTMLElement | null {
  if (candidates.length === 0) return null;
  if (!current || !candidates.includes(current)) {
    return candidates[0] ?? null;
  }

  const curRect = current.getBoundingClientRect();
  if (!hasGeometry(curRect)) {
    return findRowSequenceCandidate(current, candidates, direction);
  }

  const cx = curRect.left + curRect.width / 2;
  const cy = curRect.top + curRect.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const cand of candidates) {
    if (cand === current) continue;
    const rect = cand.getBoundingClientRect();
    if (!hasGeometry(rect)) continue;

    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    let primary = 0;
    let secondary = 0;
    let aligned = false;

    if (direction === 'right') {
      if (dx <= 2) continue;
      primary = dx;
      secondary = Math.abs(dy);
      aligned = rect.bottom >= curRect.top - 8 && rect.top <= curRect.bottom + 8;
    } else if (direction === 'left') {
      if (dx >= -2) continue;
      primary = -dx;
      secondary = Math.abs(dy);
      aligned = rect.bottom >= curRect.top - 8 && rect.top <= curRect.bottom + 8;
    } else if (direction === 'down') {
      if (dy <= 2) continue;
      primary = dy;
      secondary = Math.abs(dx);
      aligned = rect.right >= curRect.left - 8 && rect.left <= curRect.right + 8;
    } else {
      if (dy >= -2) continue;
      primary = -dy;
      secondary = Math.abs(dx);
      aligned = rect.right >= curRect.left - 8 && rect.left <= curRect.right + 8;
    }

    // Strongly favor aligned candidates in the same row/column so focus never drifts unexpectedly.
    const score = primary + secondary * (aligned ? 0.65 : 2.8);
    if (score < bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  if (best) return best;
  return findRowSequenceCandidate(current, candidates, direction);
}

const ARROW_TO_DIR: Record<string, SpatialDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function useTvSpatialNavigation({
  enabled,
  onBack,
}: {
  enabled: boolean;
  onBack?: () => boolean | void;
}) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (document.querySelector('[data-nova-player-open="true"]')) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      const isTextInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (
        event.key === 'Escape' ||
        event.key === 'Backspace' ||
        event.key === 'BrowserBack' ||
        event.key === 'GoBack'
      ) {
        if (isTextInput && event.key === 'Backspace') return;
        const handled = onBack?.();
        if (handled) {
          event.preventDefault();
          requestAnimationFrame(() => {
            const active = document.activeElement;
            if (!active || active === document.body || !document.contains(active)) {
              const first = getTvFocusables(document)[0];
              first?.focus({ preventScroll: false });
            }
          });
        }
        return;
      }

      if (isTextInput) return;
      if (target?.closest('[role="menu"], [role="listbox"], [data-nova-no-arrow-scroll]')) return;

      if (event.key === 'Enter' && target && target.getAttribute('data-tv-focusable') === 'true') {
        if (target.tagName !== 'BUTTON' && target.tagName !== 'A') {
          event.preventDefault();
          target.click();
        }
        return;
      }

      const direction = ARROW_TO_DIR[event.key];
      if (!direction) return;

      // Notify virtualized row lists ahead of movement so upcoming rows mount before focus searches.
      const activeEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const activeRowNode = activeEl?.closest<HTMLElement>('[data-tv-row-index]');
      if (activeRowNode && (direction === 'down' || direction === 'up')) {
        const idx = Number(activeRowNode.getAttribute('data-tv-row-index'));
        if (Number.isFinite(idx)) {
          window.dispatchEvent(
            new CustomEvent('nova:tv-row-approach', {
              detail: { index: direction === 'down' ? idx + 1 : Math.max(0, idx - 1) },
            }),
          );
        }
      }

      const candidates = getTvFocusables(document);
      if (candidates.length === 0) return;

      const next = findSpatialCandidate(activeEl, candidates, direction);
      if (!next) return;

      event.preventDefault();
      next.focus({ preventScroll: false });
      if (typeof next.scrollIntoView === 'function') {
        next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onBack]);
}
