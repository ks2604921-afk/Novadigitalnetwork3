import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import BottomNav, { SCROLL_REVEAL_PX } from '@/nova/components/BottomNav';

const renderNav = (view: 'main' | 'category' | 'all-categories' = 'main', onOpenAllCategories = () => {}) =>
  render(
    <BottomNav
      activeNav="home"
      onNavChange={() => {}}
      activeCategory="Series"
      onCategoryChange={() => {}}
      view={view}
      onOpenAllCategories={onOpenAllCategories}
    />,
  );

const setScroll = (y: number) => {
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
  });
};

afterEach(cleanup);

describe('category pill scroll reveal', () => {
  it('is hidden while the home page is still at the top', () => {
    renderNav();
    expect(screen.queryByRole('button', { name: 'Sports' })).toBeNull();
  });

  it('shows the ChatGPT button at the top before any scroll', () => {
    renderNav();
    expect(screen.getByRole('button', { name: 'Open ChatGPT chat' })).toBeTruthy();
  });

  it('appears once the home page is scrolled past the reveal point', () => {
    renderNav();
    setScroll(SCROLL_REVEAL_PX);
    expect(screen.getByText('Sports')).toBeTruthy();
  });

  it('stays hidden just short of the reveal point', () => {
    renderNav();
    setScroll(SCROLL_REVEAL_PX - 1);
    expect(screen.queryByRole('button', { name: 'Sports' })).toBeNull();
  });

  it('hides again when the home page is scrolled back to the top', () => {
    renderNav();
    setScroll(SCROLL_REVEAL_PX + 60);
    expect(screen.getByText('Sports')).toBeTruthy();
    setScroll(0);
    expect(screen.queryByRole('button', { name: 'Sports' })).toBeNull();
  });

  it('is not shown inside a category page', () => {
    renderNav('category');
    setScroll(SCROLL_REVEAL_PX + 60);
    expect(screen.queryByText('Sports')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open ChatGPT chat' })).toBeNull();
  });

  it('is not shown inside the all-categories page', () => {
    renderNav('all-categories');
    setScroll(SCROLL_REVEAL_PX + 60);
    expect(screen.queryByText('Sports')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open ChatGPT chat' })).toBeNull();
  });

  it('does not highlight any category on home by default', () => {
    renderNav();
    setScroll(SCROLL_REVEAL_PX);
    expect(document.querySelectorAll('.nova-pill-solid')).toHaveLength(0);
  });
});

describe('category pill arrow', () => {
  it('opens the all-categories page instead of revealing more pills', () => {
    const onOpenAllCategories = vi.fn();
    renderNav('main', onOpenAllCategories);
    setScroll(SCROLL_REVEAL_PX);
    expect(screen.queryByText('Movies')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open all categories' }));
    expect(onOpenAllCategories).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Movies')).toBeNull();
  });
});
