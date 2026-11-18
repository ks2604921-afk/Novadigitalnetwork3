import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@/lib/auth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ session: null, user: null, loading: true }),
}));
vi.mock('@/nova/components/Navbar', () => ({ default: () => null }));
vi.mock('@/nova/components/BottomNav', () => ({ default: () => null }));
vi.mock('@/nova/pages/Home', () => ({ default: () => <main aria-label="Home content" /> }));
vi.mock('@/nova/pages/Clips', () => ({ default: () => null }));
vi.mock('@/nova/pages/Search', () => ({ default: () => null }));
vi.mock('@/nova/pages/Profile', () => ({ default: () => null }));
vi.mock('@/nova/pages/ComingSoon', () => ({ default: () => null }));
vi.mock('@/nova/pages/CategoryPage', () => ({ default: () => null }));
const { authFlow, intro } = vi.hoisted(() => ({ authFlow: vi.fn(() => null), intro: vi.fn(() => null) }));
vi.mock('@/nova/components/AuthFlow', () => ({ default: authFlow }));
vi.mock('@/nova/components/StartupIntro', () => ({ default: intro }));

import App from '@/nova/App';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Direct NOVA entry', () => {
  it('opens home without a session, even while authentication is loading', () => {
    render(<App />);
    expect(screen.getByRole('main', { name: 'Home content' })).toBeInTheDocument();
    expect(authFlow).not.toHaveBeenCalled();
  });

  it('plays the startup intro when the app opens', () => {
    render(<App />);
    expect(intro).toHaveBeenCalled();
  });
});