import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@/lib/auth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ session: null, user: null, loading: false }),
}));
vi.mock('@/nova/components/Navbar', () => ({ default: () => null }));
vi.mock('@/nova/components/BottomNav', () => ({ default: () => null }));
vi.mock('@/nova/components/SideRail', () => ({
  default: ({ onNavChange }: { onNavChange: (id: string) => void }) => (
    <button type="button" onClick={() => onNavChange('profile')}>Go Profile</button>
  ),
}));
vi.mock('@/nova/pages/Home', () => ({ default: () => <section aria-label="Home content" /> }));
vi.mock('@/nova/pages/Clips', () => ({ default: () => null }));
vi.mock('@/nova/pages/Search', () => ({ default: () => null }));
vi.mock('@/nova/pages/Profile', () => ({
  default: ({ onLogout }: { onLogout: () => void }) => (
    <button type="button" onClick={onLogout}>Log Out</button>
  ),
}));
vi.mock('@/nova/pages/ComingSoon', () => ({ default: () => null }));
vi.mock('@/nova/pages/CategoryPage', () => ({ default: () => null }));
vi.mock('@/nova/pages/AllCategories', () => ({ default: () => null }));

import App from '@/nova/App';
import { OTP_BUFFER_MS } from '@/nova/components/TvLogin';
import { loadActiveProfile, loadProfiles } from '@/nova/profile-store';
import { isOldNovaUser } from '@/nova/user-account';

const TV = 'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV';

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe('TV new vs old mobile number registration flow', () => {
  it('routes new numbers through OTP -> Name -> Avatar -> Language -> direct Home, and old numbers through Welcome -> OTP -> WhosWatching', () => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);

    render(<App />);

    // Finish StartupIntro -> Welcome Poster -> Login
    act(() => {
      vi.advanceTimersByTime(4200);
    });
    expect(screen.getByText('Welcome in your universe of entertainment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Enter new mobile number -> Get OTP -> Verify OTP
    for (const d of '9988776655') fireEvent.click(screen.getByRole('button', { name: d }));
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    for (const d of '1234') fireEvent.click(screen.getByRole('button', { name: d }));
    fireEvent.click(screen.getByRole('button', { name: /Verify & Continue/i }));
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });

    // Step 1: Name -> Step 2: Avatar -> Step 3: Language -> direct Home (no WhosWatching)
    expect(screen.getByTestId('new-user-step-name')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'Aditya' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.getByTestId('new-user-step-avatar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Avatar Iron Hero' }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.getByTestId('new-user-step-language')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hindi' }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.getByTestId('new-user-step-ready')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome! Your profile is ready' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Let's Begin/i }));

    expect(screen.queryByTestId('new-user-setup')).toBeNull();
    expect(screen.queryByTestId('tv-profile-selection')).toBeNull();
    expect(screen.getByLabelText('Home content')).toBeInTheDocument();
    expect(isOldNovaUser('9988776655')).toBe(true);
    const created = loadProfiles().find((p) => p.name === 'Aditya');
    expect(created?.avatar).toBe('iron-hero');
    expect(loadActiveProfile()).toBe(created?.id);

    // Logout goes straight to mobile login screen (no Welcome poster)
    fireEvent.click(screen.getByRole('button', { name: 'Go Profile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }));
    expect(screen.getByTestId('tv-login-screen')).toBeInTheDocument();
    expect(screen.queryByText('Welcome in your universe of entertainment')).toBeNull();

    // Re-open with the now-registered (old) number: Welcome -> Mobile -> OTP -> Profile Selection
    cleanup();
    localStorage.removeItem('nova-sample-login');
    localStorage.removeItem('nova-active-phone');
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(4200);
    });
    expect(screen.getByText('Welcome in your universe of entertainment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    for (const d of '9988776655') fireEvent.click(screen.getByRole('button', { name: d }));
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    for (const d of '1234') fireEvent.click(screen.getByRole('button', { name: d }));
    fireEvent.click(screen.getByRole('button', { name: /Verify & Continue/i }));
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });

    expect(screen.getByTestId('tv-profile-selection')).toBeInTheDocument();
    expect(screen.getByText('Aditya')).toBeInTheDocument();
  }, 15_000);

  it('plays StartupIntro completely before showing WhosWatching for returning users and never replays intro on profile pick', () => {
    localStorage.clear();
    localStorage.setItem('nova-sample-login', '1');
    vi.useFakeTimers();
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);

    render(<App />);

    // StartupIntro must remain uninterrupted and uncovered during its 4.2s playback.
    expect(screen.getByRole('dialog', { name: 'NOVA intro' })).toBeInTheDocument();
    expect(screen.queryByTestId('tv-profile-selection')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('dialog', { name: 'NOVA intro' })).toBeInTheDocument();
    expect(screen.queryByTestId('tv-profile-selection')).toBeNull();

    // Completing StartupIntro reveals WhosWatching cleanly.
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.queryByRole('dialog', { name: 'NOVA intro' })).toBeNull();
    expect(screen.getByTestId('tv-profile-selection')).toBeInTheDocument();

    // Selecting a profile enters Home and never brings StartupIntro back.
    fireEvent.click(screen.getByRole('button', { name: 'Watch as Pranaay Mi' }));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole('dialog', { name: 'NOVA intro' })).toBeNull();
    expect(screen.queryByTestId('tv-profile-selection')).toBeNull();
    expect(screen.getByLabelText('Home content')).toBeInTheDocument();
  });
});
