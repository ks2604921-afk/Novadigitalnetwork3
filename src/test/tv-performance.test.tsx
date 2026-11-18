import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PosterImage from '@/nova/components/PosterImage';
import { VirtualizedCardStrip, VirtualizedRowList } from '@/nova/components/VirtualizedRowList';
import SideRail from '@/nova/components/SideRail';
import BottomNav from '@/nova/components/BottomNav';
import Home from '@/nova/pages/Home';
import {
  findSpatialCandidate,
  optimizePosterUrl,
  useTvSpatialNavigation,
} from '@/nova/tv-spatial-nav';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function SpatialHarness({ onBack }: { onBack: () => boolean | void }) {
  useTvSpatialNavigation({ enabled: true, onBack });
  return (
    <div data-testid="spatial-harness">
      <aside data-tv-region="rail">
        <button type="button" data-tv-focusable="true" data-testid="rail-home">
          Home
        </button>
      </aside>
      <main data-tv-region="main">
        <div data-tv-row="true" data-tv-row-index="0">
          <button type="button" data-tv-focusable="true" data-testid="r0-c0">
            R0 C0
          </button>
          <button type="button" data-tv-focusable="true" data-testid="r0-c1">
            R0 C1
          </button>
        </div>
        <div data-tv-row="true" data-tv-row-index="1">
          <button type="button" data-tv-focusable="true" data-testid="r1-c0">
            R1 C0
          </button>
          <button type="button" data-tv-focusable="true" data-testid="r1-c1">
            R1 C1
          </button>
        </div>
      </main>
    </div>
  );
}

describe('Smart TV 60 FPS performance & spatial navigation', () => {
  it('supports strict 4-way spatial D-pad navigation with geometric alignment', () => {
    render(<SpatialHarness onBack={() => false} />);
    const rail = screen.getByTestId('rail-home');
    const r0c0 = screen.getByTestId('r0-c0');
    const r0c1 = screen.getByTestId('r0-c1');
    const r1c0 = screen.getByTestId('r1-c0');
    const r1c1 = screen.getByTestId('r1-c1');

    const makeRect = (left: number, top: number, width: number, height: number): DOMRect =>
      ({
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        toJSON: () => ({}),
      }) as DOMRect;

    vi.spyOn(rail, 'getBoundingClientRect').mockReturnValue(makeRect(16, 120, 64, 48));
    vi.spyOn(r0c0, 'getBoundingClientRect').mockReturnValue(makeRect(120, 100, 200, 120));
    vi.spyOn(r0c1, 'getBoundingClientRect').mockReturnValue(makeRect(340, 100, 200, 120));
    vi.spyOn(r1c0, 'getBoundingClientRect').mockReturnValue(makeRect(120, 260, 200, 120));
    vi.spyOn(r1c1, 'getBoundingClientRect').mockReturnValue(makeRect(340, 260, 200, 120));

    const candidates = [rail, r0c0, r0c1, r1c0, r1c1];
    expect(findSpatialCandidate(null, candidates, 'right')).toBe(rail);
    expect(findSpatialCandidate(rail, candidates, 'right')).toBe(r0c0);
    expect(findSpatialCandidate(r0c0, candidates, 'right')).toBe(r0c1);
    expect(findSpatialCandidate(r0c1, candidates, 'down')).toBe(r1c1);
    expect(findSpatialCandidate(r1c1, candidates, 'left')).toBe(r1c0);
    expect(findSpatialCandidate(r1c0, candidates, 'up')).toBe(r0c0);
    expect(findSpatialCandidate(r0c0, candidates, 'left')).toBe(rail);
  });

  it('recovers lost focus and handles Escape / Backspace TV remote keys', () => {
    const onBack = vi.fn(() => true);
    render(<SpatialHarness onBack={onBack} />);

    // Focus is on document.body initially -> ArrowDown recovers to first focusable without losing focus
    document.body.focus();
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByTestId('rail-home'));

    // Move right -> row 0 col 0 -> row 0 col 1 -> down to row 1 col 0
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByTestId('r0-c0'));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByTestId('r0-c1'));
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByTestId('r1-c0'));
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(screen.getByTestId('r0-c0'));

    // Backspace / Escape invoke TV back handler
    fireEvent.keyDown(window, { key: 'Backspace' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it('optimizes remote poster CDN URLs to compact WebP and lazy-loads images cleanly', () => {
    const pexels = 'https://images.pexels.com/photos/123/pexels-photo-123.jpeg?auto=compress&cs=tinysrgb&w=1200';
    const optimized = optimizePosterUrl(pexels, 320);
    expect(optimized).toContain('fm=webp');
    expect(optimized).toContain('w=320');
    expect(optimized).toContain('auto=compress');

    expect(optimizePosterUrl('/assets/barcode-poster.webp')).toBe('/assets/barcode-poster.webp');

    render(<PosterImage src={pexels} alt="Optimized WebP Poster" width={360} />);
    const img = screen.getByAltText('Optimized WebP Poster');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(img.getAttribute('data-src')).toContain('fm=webp');
  });

  it('virtualizes off-screen vertical rows and large horizontal card strips for low-RAM TVs', () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ id: `row-${i}`, title: `Row ${i}` }));
    const { container } = render(
      <VirtualizedRowList
        items={rows}
        getKey={(r) => r.id}
        initialMountedCount={3}
        overscan={1}
        renderRow={(r) => <div data-testid={`mounted-${r.id}`}>{r.title}</div>}
      />,
    );

    expect(screen.getByTestId('mounted-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('mounted-row-2')).toBeInTheDocument();
    expect(screen.queryByTestId('mounted-row-8')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-tv-row-mounted="false"]').length).toBe(9);

    // D-pad approaching row 8 mounts row 8 + overscan neighbors on demand
    fireEvent(window, new CustomEvent('nova:tv-row-approach', { detail: { index: 8 } }));
    expect(screen.getByTestId('mounted-row-8')).toBeInTheDocument();
    expect(screen.getByTestId('mounted-row-9')).toBeInTheDocument();

    // Horizontal strip virtualizes when item count exceeds threshold
    const cards = Array.from({ length: 16 }, (_, i) => ({ id: `c-${i}` }));
    const strip = render(
      <VirtualizedCardStrip
        items={cards}
        getKey={(c) => c.id}
        itemWidthPx={200}
        virtualThreshold={8}
        renderCard={(c) => <div data-testid={c.id}>{c.id}</div>}
      />,
    );
    expect(strip.container.querySelector('.tv-scroll-row')).toBeTruthy();
    expect(strip.container.querySelectorAll('[data-testid^="c-"]').length).toBeLessThan(16);
  });

  it('renders Home with virtualized rows, tv-focusable cards, and zero heavy backdrop-blur passes', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc}>
        <Home />
      </QueryClientProvider>,
    );
    // Off-screen Home rows stay unmounted placeholders until scrolled/focused
    expect(container.querySelectorAll('[data-tv-row-mounted="false"]').length).toBeGreaterThan(5);
    expect(container.querySelector('.tv-focusable')).toBeTruthy();
    expect(container.querySelector('.tv-scroll-row')).toBeTruthy();
    expect(container.innerHTML).not.toContain('backdrop-blur');
    expect(screen.queryByRole('button', { name: /^Go to /i })).toBeNull();
    const cwCard = screen.getByRole('button', { name: 'Resume Demon Slayer' });
    expect(cwCard.textContent?.trim()).toBe('');
    expect(screen.queryByText(/Serial · S1:E5/i)).toBeNull();
    const serialMeta = within(cwCard.parentElement!).getByTestId('continue-serial-meta');
    expect(serialMeta).toHaveTextContent('S1 E5 · 21 Nov');
    expect(serialMeta).toHaveTextContent('21m left');
    expect(serialMeta.textContent).not.toContain('Demon Slayer');

    const movieCard = screen.getByRole('button', { name: 'Resume Shadow Protocol' });
    expect(movieCard.textContent?.trim()).toBe('');
    expect(within(movieCard.parentElement!).queryByTestId('continue-serial-meta')).toBeNull();
    const movieMeta = within(movieCard.parentElement!).getByTestId('continue-movie-meta');
    expect(movieMeta).toHaveTextContent('Shadow Protocol');
    expect(movieMeta).toHaveTextContent('1h 26m left');
    expect(screen.queryByText('Echoes of Tomorrow')).toBeNull();

    const rail = render(
      <SideRail
        activeNav="home"
        onNavChange={() => {}}
        expanded={false}
        onExpandedChange={() => {}}
        onOpenCategories={() => {}}
        categoriesActive={false}
        bigScreen
      />,
    );
    expect(rail.container.innerHTML).not.toContain('backdrop-blur');
    expect(rail.container.querySelector('.tv-focusable')).toBeTruthy();

    const bottom = render(
      <BottomNav
        activeNav="home"
        onNavChange={() => {}}
        activeCategory="Series"
        onCategoryChange={() => {}}
        view="main"
        onOpenAllCategories={() => {}}
      />,
    );
    expect(bottom.container.innerHTML).not.toContain('backdrop-blur');
  });

  it('produces identical initial PosterImage attributes on SSR and client before useEffect', async () => {
    const { renderToString } = await import('react-dom/server');
    const { hydrateRoot } = await import('react-dom/client');
    const url = 'https://images.pexels.com/photos/123/pexels-photo-123.jpeg?auto=compress&cs=tinysrgb&w=1200';
    const serverMarkup = renderToString(<PosterImage src={url} alt="SSR Poster" width={360} />);

    // Lazy PosterImage must NOT inject a standalone `src="..."` attribute on SSR when client defers until mount
    expect(serverMarkup).not.toMatch(/\ssrc="https:\/\//);
    expect(serverMarkup).toContain('data-src="https://');

    const { act } = await import('@testing-library/react');
    const host = document.createElement('div');
    host.innerHTML = serverMarkup;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(host, <PosterImage src={url} alt="SSR Poster" width={360} />);
    });
    expect(errorSpy).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });
});
