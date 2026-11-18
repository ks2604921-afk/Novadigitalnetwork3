import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as accountFunctions from '@/lib/account.functions';
import { AuthProvider } from '@/lib/auth';
import DesktopLogin from '@/nova/components/DesktopLogin';
import PremiumGuestPoster from '@/nova/components/PremiumGuestPoster';
import TvLogin, { OTP_BUFFER_MS, OTP_RESEND_SECONDS, STATUS_NOTE_MS } from '@/nova/components/TvLogin';
import GuestWelcome from '@/nova/components/GuestWelcome';
import NewUserSetup from '@/nova/components/NewUserSetup';
import NotificationStrip from '@/nova/components/NotificationStrip';
import ProfileOnboarding, { ONBOARDING_BUFFER_MS } from '@/nova/components/ProfileOnboarding';
import Profile from '@/nova/pages/Profile';
import { formatAccountDate, formatFullPhone, resolveFallbackSubscription } from '@/nova/subscription';
import { isOldNovaUser, registerNovaPhone } from '@/nova/user-account';
import { detectCurrentDevice, isDesktopDevice, shouldShowKeypad } from '@/nova/watching-profile-rules';

const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
const PHONE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36';
const TV = 'Mozilla/5.0 (Linux; Android 12; BRAVIA 4K) AppleWebKit/537.36 Chrome/130 Safari/537.36 Android TV';

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe('keypad is TV-only', () => {
  it('shows on a TV', () => expect(shouldShowKeypad(TV)).toBe(true));
  it('hides on desktop', () => expect(shouldShowKeypad(DESKTOP)).toBe(false));
  it('hides on phone', () => expect(shouldShowKeypad(PHONE)).toBe(false));
});

describe('desktop detection for the Profile login box', () => {
  it('wide mouse-driven computer is desktop', () => expect(isDesktopDevice(DESKTOP, true, 1440)).toBe(true));
  it('phone is not desktop', () => expect(isDesktopDevice(PHONE, false, 412)).toBe(false));
  it('TV is not desktop', () => expect(isDesktopDevice(TV, true, 1920)).toBe(false));
  it('narrow window is not desktop', () => expect(isDesktopDevice(DESKTOP, true, 800)).toBe(false));
});

describe('real-time device detection in Profile Account view', () => {
  it('detects TV, desktop, and mobile browsers with optional model hints', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    expect(detectCurrentDevice().name).toBe('Sony BRAVIA TV');
    expect(detectCurrentDevice('KD-55X80L').name).toBe('KD-55X80L · Sony BRAVIA TV');

    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(DESKTOP);
    expect(detectCurrentDevice().name).toBe('Windows PC');
    expect(detectCurrentDevice().browser).toBe('Chrome');
  });

  it('fetches the live device automatically in Settings & Help without a refresh button, Live badge, or mobile Update button', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    render(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 1, onLogout: () => undefined }),
      ),
    );

    expect(screen.getByTestId('settings-side-panel')).toBeInTheDocument();
    expect(screen.getByTestId('current-device-name')).toHaveTextContent('Sony BRAVIA TV');
    expect(screen.getByTestId('current-device-meta')).toHaveTextContent('Last used : Today');
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.queryByText(/Our team is always here for you/i)).toBeNull();
    expect(screen.queryByText('Live')).toBeNull();
    expect(screen.queryByText(/Active now/i)).toBeNull();
    expect(screen.queryByText(/Privacy Policy/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /refresh/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Update/i })).toBeNull();

    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(DESKTOP);
    fireEvent(window, new Event('focus'));
    expect(screen.getByTestId('current-device-name')).toHaveTextContent('Windows PC');
  });

  it('shows full phone, Paid badge next to Mobile 1 Month, fetched date, and JioHotstar-style note only on Upgrade', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    vi.spyOn(accountFunctions, 'getAccountSubscription').mockResolvedValue({
      planName: 'Mobile 1 Month',
      tier: 'normal',
      paid: true,
      actionLabel: 'Upgrade',
      fetchedAt: '2026-11-18T10:00:00.000Z',
      expiresAt: '2026-12-12T10:00:00.000Z',
    });

    render(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 1, onLogout: () => undefined }),
      ),
    );

    const phoneEl = screen.getByTestId('account-full-phone');
    expect(phoneEl).toHaveTextContent('+91 98765 43210');
    expect(phoneEl.textContent).not.toContain('***');

    expect(screen.getByRole('heading', { name: 'Mobile 1 Month' })).toBeInTheDocument();
    expect(screen.getByTestId('account-plan-paid')).toHaveTextContent('Paid');

    await waitFor(() => {
      const dateEl = screen.getByTestId('account-plan-date');
      expect(dateEl).toHaveTextContent('Valid till 12 Dec 2026');
      expect(dateEl.textContent).not.toMatch(/Updated/i);
    });
    expect(screen.queryByText(/24 days/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    expect(screen.getByRole('heading', { name: 'Upgrade Plan' })).toBeInTheDocument();
    const noteCard = screen.getByTestId('upgrade-note-card');
    expect(noteCard).toHaveTextContent(/visit our platform/i);
    expect(noteCard.textContent).not.toMatch(/Valid till/i);
    expect(noteCard.textContent).not.toMatch(/novadigital\.app/i);
    expect(noteCard.textContent).not.toMatch(/Account status synced/i);
    expect(screen.queryByRole('button', { name: /Choose/i })).toBeNull();
    expect(screen.queryByText('Super Premium')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByText('Manage Subscription')).toBeNull();
    expect(screen.getByTestId('settings-side-panel')).toBeInTheDocument();
    expect(screen.getByTestId('this-device-card')).toBeInTheDocument();
  });

  it('fetches unsubscribed state cleanly, shows Subscribe instead of Upgrade without Paid, and opens note card', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    vi.spyOn(accountFunctions, 'getAccountSubscription').mockResolvedValue({
      planName: 'No Active Plan',
      tier: 'none',
      paid: false,
      actionLabel: 'Subscribe',
      fetchedAt: '2026-11-18T10:00:00.000Z',
      expiresAt: null,
    });

    expect(formatFullPhone('8092153438')).toBe('+91 80921 53438');
    expect(formatAccountDate('2026-11-18T10:00:00.000Z')).toContain('Nov 2026');
    const unsubFallback = resolveFallbackSubscription('9988776655', new Date('2026-11-18T10:00:00.000Z'));
    expect(unsubFallback.actionLabel).toBe('Subscribe');
    expect(unsubFallback.paid).toBe(false);

    render(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 1, onLogout: () => undefined }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Upgrade' })).toBeNull();
    expect(screen.queryByTestId('account-plan-paid')).toBeNull();
    expect(screen.getByTestId('account-plan-date')).toHaveTextContent('No active subscription');
    expect(screen.getByTestId('account-plan-date').textContent).not.toMatch(/Updated/i);

    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(screen.getByRole('heading', { name: 'Subscribe to NOVA' })).toBeInTheDocument();
    const subNote = screen.getByTestId('upgrade-note-card');
    expect(subNote).toHaveTextContent(/visit our platform/i);
    expect(subNote.textContent).not.toMatch(/novadigital\.app/i);
    expect(subNote.textContent).not.toMatch(/Account status synced/i);
    expect(screen.queryByRole('button', { name: /Choose/i })).toBeNull();
  });

  it('renders DesktopLogin without QR scanner or removed headings and completes phone OTP login', () => {
    const onDone = vi.fn();
    render(createElement(DesktopLogin, { onDone }));

    expect(screen.queryByText(/Login or sign up to continue/i)).toBeNull();
    expect(screen.queryByText(/Scan QR code or enter phone number to login/i)).toBeNull();
    expect(screen.queryByText(/Use Camera App to Scan QR/i)).toBeNull();

    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));
    fireEvent.change(screen.getByLabelText('OTP'), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify & Continue/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('portals ProfileOnboarding language and welcome screens above SideRail and Navbar, shows chosen avatar and Welcome to NOVA, and buffers on Get Started', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const { container } = render(
      createElement(ProfileOnboarding, { name: 'kkkk', avatar: 'iron-hero', onDone }),
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const langDialog = screen.getByRole('dialog', { name: 'Profile preferences' });
    expect(langDialog.className).toContain('z-[210]');
    expect(langDialog.querySelectorAll('img').length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Hindi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const welcomeDialog = screen.getByRole('dialog', { name: 'Profile preferences' });
    expect(welcomeDialog.className).toContain('z-[210]');
    expect(welcomeDialog.querySelectorAll('img').length).toBe(0);
    expect(screen.getByTestId('onboarding-profile-avatar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome to NOVA' })).toBeInTheDocument();
    expect(screen.queryByText(/Welcome to NOVA, kkkk!/i)).toBeNull();
    expect(screen.queryByText(/Your entertainment universe is ready/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));
    expect(screen.getByTestId('onboarding-buffering')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-spinner')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(ONBOARDING_BUFFER_MS);
    });
    expect(onDone).toHaveBeenCalledWith(['Hindi']);
  });

  it('excludes Language and Device push notifications from Settings & Help and falls back cleanly', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    const { rerender } = render(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 1, requestedSetting: 'Language', onLogout: () => undefined }),
      ),
    );

    const sidePanel = screen.getByTestId('settings-side-panel');
    expect(sidePanel).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Language/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Language' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();

    rerender(
      createElement(
        AuthProvider,
        null,
        createElement(Profile, { bigScreen: true, settingsRequest: 2, requestedSetting: 'Notifications', onLogout: () => undefined }),
      ),
    );
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByText(/Device push notifications/i)).toBeNull();
  });

  it('renders centered TvLogin screen with compact highlighted color-only buffering and buffers on Verify & Continue', () => {
    vi.useFakeTimers();
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(TV);
    const onDone = vi.fn();
    render(createElement(TvLogin, { onDone }));

    const tvLoginRoot = screen.getByTestId('tv-login-screen');
    expect(tvLoginRoot).toBeInTheDocument();
    expect(tvLoginRoot.querySelectorAll('img').length).toBe(0);
    expect(screen.queryByText('Smart TV')).toBeNull();
    expect(screen.queryByText('Login on TV')).toBeNull();
    expect(screen.queryByText(/Use your TV remote keypad/i)).toBeNull();
    expect(screen.queryByText(/Remote & keyboard ready/i)).toBeNull();
    expect(screen.getByText('Log in with your mobile number')).toBeInTheDocument();
    expect(OTP_BUFFER_MS).toBeLessThanOrEqual(2000);

    for (const digit of '8092123438') {
      fireEvent.click(screen.getByRole('button', { name: digit }));
    }
    expect(screen.queryByRole('button', { name: /Clear/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));

    const buffering = screen.getByTestId('tv-login-buffering');
    const spinner = screen.getByTestId('tv-login-spinner');
    expect(buffering).toBeInTheDocument();
    expect(buffering.className).toContain('bg-transparent');
    expect(buffering.className).not.toContain('bg-nova-black');
    expect(spinner.className).toContain('h-10');
    expect(spinner.className).toContain('w-10');
    expect(spinner.className).toContain('rounded-full');
    expect(spinner.className).toContain('bg-transparent');
    expect(spinner.className).toContain('border-transparent');
    expect(spinner.className).not.toContain('border-white/15');
    expect(spinner.className).toContain('border-t-[#ff47a3]');

    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS - 100);
    });
    expect(screen.getByTestId('tv-login-buffering')).toBeInTheDocument();
    expect(screen.queryByTestId('tv-login-otp')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByTestId('tv-login-buffering')).toBeNull();
    expect(screen.getByTestId('tv-login-otp')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Enter OTP' })).toBeInTheDocument();
    expect(screen.getByText(/Sent to/i)).toBeInTheDocument();
    const phoneEl = screen.getByText('+91 8092123438');
    expect(phoneEl).toBeInTheDocument();
    expect(phoneEl.className).toContain('text-white');
    expect(screen.queryByText(/OTP sent to your no/i)).toBeNull();
    expect(screen.queryByText(/Sample OTP/i)).toBeNull();
    expect(screen.queryByText(/Change number/i)).toBeNull();

    expect(screen.getByTestId('tv-login-resend-timer')).toHaveTextContent(`Resend in 00:${String(OTP_RESEND_SECONDS).padStart(2, '0')}`);
    const smsBtn = screen.getByTestId('tv-login-resend-sms');
    const callBtn = screen.getByTestId('tv-login-resend-call');
    expect(smsBtn).toBeDisabled();
    expect(callBtn).toBeDisabled();

    for (let s = 0; s < 13; s++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(screen.getByTestId('tv-login-resend-timer')).toHaveTextContent('Resend in 00:17');
    for (let s = 0; s < 17; s++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(smsBtn).toBeEnabled();
    expect(callBtn).toBeEnabled();
    fireEvent.click(smsBtn);
    expect(screen.getByTestId('tv-login-buffering')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    expect(screen.queryByTestId('tv-login-buffering')).toBeNull();
    expect(screen.getByText('OTP resent via SMS to +91 809xxxx38')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(STATUS_NOTE_MS);
    });
    expect(screen.queryByText(/OTP resent via SMS/i)).toBeNull();

    const editBtn = screen.getByRole('button', { name: 'Edit mobile number' });
    expect(editBtn).toHaveTextContent('Edit');
    expect(editBtn.className).not.toContain('rounded-full');

    fireEvent.click(editBtn);
    expect(screen.getByTestId('tv-login-phone')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    expect(screen.getByTestId('tv-login-otp')).toBeInTheDocument();

    for (const digit of '1234') {
      fireEvent.click(screen.getByRole('button', { name: digit }));
    }
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Verify & Continue/i }));
    expect(screen.getByTestId('tv-login-buffering')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    expect(screen.queryByTestId('tv-login-buffering')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onDone).toHaveBeenCalledWith('8092123438');

    cleanup();
    const onDoneKey = vi.fn();
    render(createElement(TvLogin, { onDone: onDoneKey }));
    for (const key of '9876543210') {
      fireEvent.keyDown(window, { key });
    }
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByTestId('tv-login-buffering')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    expect(screen.getByTestId('tv-login-otp')).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    for (const key of '1234') {
      fireEvent.keyDown(window, { key });
    }
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByTestId('tv-login-buffering')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(OTP_BUFFER_MS);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onDoneKey).toHaveBeenCalledWith('9876543210');
  });

  it('renders single-line TV GuestWelcome poster without hub tags or background mosaic, with clickable legal links and NOVA-colored Continue', () => {
    const onContinue = vi.fn();
    render(createElement(GuestWelcome, { onContinue }));
    const heading = screen.getByRole('heading', { name: 'Welcome in your universe of entertainment' });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain('whitespace-nowrap');
    expect(screen.queryByText('NOVA ORIGINALS')).toBeNull();
    expect(screen.queryByText('4K ULTRA HD')).toBeNull();
    expect(screen.queryByText('LIVE SPORTS')).toBeNull();
    expect(screen.queryByText('DOLBY ATMOS')).toBeNull();
    expect(screen.getByText(/Continuing confirms you are 18\+ and accept our/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Terms of Use' }));
    expect(screen.getByRole('dialog', { name: 'Terms of Use' })).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByRole('dialog', { name: 'Terms of Use' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Privacy Policy' }));
    expect(screen.getByRole('dialog', { name: 'Privacy Policy' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    expect(continueBtn.className).toContain('nova-pill-solid');
    expect(continueBtn.className).not.toContain('2563eb');
    fireEvent.click(continueBtn);
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Login to enjoy')).toBeNull();
  });

  it('opens a full Notifications page when clicking the Notifications arrow/header and hides arrows on notification cards', () => {
    localStorage.clear();
    render(createElement(NotificationStrip));
    const cardBtn = screen.getByRole('button', { name: /Maharani S3/i });
    expect(cardBtn.querySelectorAll('svg').length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Open notifications page' }));
    const page = screen.getByTestId('notifications-page');
    expect(page).toBeInTheDocument();
    expect(within(page).getByRole('heading', { level: 1, name: 'Notifications' })).toBeInTheDocument();
    fireEvent.click(within(page).getByRole('button', { name: 'Clear all' }));
    expect(within(page).getByText('No new notifications')).toBeInTheDocument();
    fireEvent.click(within(page).getByRole('button', { name: 'Back' }));
    expect(screen.queryByTestId('notifications-page')).toBeNull();
  });

  it('distinguishes old user 8092153438 from new numbers and renders PremiumGuestPoster for new users', () => {
    localStorage.clear();
    expect(isOldNovaUser('8092153438')).toBe(true);
    expect(isOldNovaUser('9876543210')).toBe(false);

    const onContinueGuest = vi.fn();
    const onSelectPlan = vi.fn();
    const onSwitchAccount = vi.fn();
    render(
      createElement(PremiumGuestPoster, {
        phone: '9876543210',
        onContinueGuest,
        onSelectPlan,
        onSwitchAccount,
      }),
    );

    const posterScreen = screen.getByTestId('premium-guest-poster');
    expect(posterScreen).toBeInTheDocument();
    expect(posterScreen.querySelectorAll('img').length).toBe(0);
    expect(screen.getByText('+91 9876xxxx10')).toBeInTheDocument();
    expect(screen.getByText('NOVA Premium Guest Pass')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Super Premium/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue with Super Premium/i }));
    expect(onSelectPlan).toHaveBeenCalledWith('Super Premium');

    fireEvent.click(screen.getByRole('button', { name: 'Explore as Guest' }));
    expect(onContinueGuest).toHaveBeenCalledTimes(1);

    registerNovaPhone('9876543210');
    expect(isOldNovaUser('9876543210')).toBe(true);
  });

  it('walks new users through Name -> Avatar -> Language -> Ready poster in NewUserSetup with zero step counter or img elements', () => {
    const onDone = vi.fn();
    render(createElement(NewUserSetup, { onDone }));

    const setup = screen.getByTestId('new-user-setup');
    expect(setup.querySelectorAll('img').length).toBe(0);
    expect(screen.queryByText(/Step 1/i)).toBeNull();
    expect(screen.getByTestId('new-user-step-name')).toBeInTheDocument();

    const nameContinue = screen.getByRole('button', { name: /Continue/i });
    expect(nameContinue).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'Aditya' } });
    expect(nameContinue).toBeEnabled();
    fireEvent.click(nameContinue);

    expect(screen.queryByText(/Step 2/i)).toBeNull();
    expect(screen.getByTestId('new-user-step-avatar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Avatar Iron Hero' }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.queryByText(/Step 3/i)).toBeNull();
    expect(screen.getByTestId('new-user-step-language')).toBeInTheDocument();
    const langContinue = screen.getByRole('button', { name: /Continue/i });
    expect(langContinue).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Hindi' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(langContinue).toBeEnabled();
    fireEvent.click(langContinue);

    expect(screen.getByTestId('new-user-step-ready')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome! Your profile is ready' })).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Let's Begin/i }));
    expect(onDone).toHaveBeenCalledWith({
      name: 'Aditya',
      avatar: 'iron-hero',
      languages: ['Hindi', 'English'],
    });
  });
});
