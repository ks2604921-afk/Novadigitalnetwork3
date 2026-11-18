import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import BottomNav from '@/nova/components/BottomNav';
import { navItems } from '@/nova/navigation';

const renderNav = (activeNav: string, onNavChange = () => {}) =>
  render(
    <BottomNav
      activeNav={activeNav}
      onNavChange={onNavChange}
      activeCategory="Series"
      onCategoryChange={() => {}}
      view="main"
      onOpenAllCategories={() => {}}
    />,
  );

afterEach(cleanup);

describe('bottom navigation bar', () => {
  it('shows every tab from the shared nav list', () => {
    renderNav('home');
    navItems.forEach((item) => {
      expect(screen.getByRole('button', { name: new RegExp(item.label, 'i') })).toBeInTheDocument();
    });
  });

  it('marks only the selected tab as the current page', () => {
    renderNav('coming-soon');
    const current = screen.getAllByRole('button', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Coming Soon');
  });

  it('moves the current-page marker when another tab is tapped', () => {
    const onNavChange = vi.fn();
    renderNav('home', onNavChange);
    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(onNavChange).toHaveBeenCalledWith('profile');
  });

  it('keeps the pill at TV, Series, Sports with no More option', () => {
    const { container } = renderNav('home');
    expect(screen.getByText('TV')).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.queryByText('More')).toBeNull();
    expect(container.querySelectorAll('.nova-pill-indicator')).toHaveLength(0);
  });

  it('shows no glow or underline highlight on the selected tab', () => {
    const { container } = renderNav('home');
    expect(container.querySelectorAll('.nova-nav-indicator')).toHaveLength(0);
    expect(container.querySelectorAll('.nova-nav-active')).toHaveLength(0);
    expect(container.querySelectorAll('.nova-pill-active')).toHaveLength(0);
  });
});
