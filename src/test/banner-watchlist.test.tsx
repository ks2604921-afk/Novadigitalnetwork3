import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import BannerWatchlist from '@/nova/components/BannerWatchlist';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Banner watchlist', () => {
  it('adds and removes the current title from the existing device watchlist', () => {
    render(<BannerWatchlist title="Saruam Maya" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Saruam Maya to watchlist' }));
    expect(localStorage.getItem('nova-watchlist:Saruam Maya')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Saruam Maya from watchlist' }));
    expect(localStorage.getItem('nova-watchlist:Saruam Maya')).toBe('false');
  });
  it('keeps each banner title saved independently across visits', () => {
    localStorage.setItem('nova-watchlist:Saruam Maya', 'true');
    const { rerender } = render(<BannerWatchlist title="Saruam Maya" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    rerender(<BannerWatchlist title="Neon Dreams" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('nova-watchlist:Saruam Maya')).toBe('true');
  });
});