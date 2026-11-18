import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { defaultProfiles, loadActiveProfile, loadProfiles, saveProfiles, saveActiveProfile, type StoredProfile } from '@/nova/profile-store';
import { useAuth } from '@/lib/auth';
import {
  Bell,
  Check,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Edit3,
  HelpCircle,
  LogOut,
  Monitor,
  Play,
  Plus,
  Settings2,
  ShieldCheck,
  Smartphone,
  Tablet,
  Tv,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParentalPin from '@/nova/components/ParentalPin';
import NotificationStrip from '@/nova/components/NotificationStrip';
import ProfileEditor from '@/nova/components/ProfileEditor';
import ProfileEditActions from '@/nova/components/ProfileEditActions';
import ProfileBadge from '@/nova/components/ProfileBadge';
import { insertBeforeKids, createProfileDraft, removeProfile } from '@/nova/profile-rules';
import { getRemainingMinutesLabel } from '@/nova/related-catalog';
import { getAccountSubscription } from '@/lib/account.functions';
import {
  formatAccountDate,
  formatFullPhone,
  resolveFallbackSubscription,
  type AccountSubscription,
} from '@/nova/subscription';
import { isOldNovaUser, loadCurrentPhone, normalizePhoneNumber } from '@/nova/user-account';
import { detectCurrentDevice, getNavigatorDeviceExtras, type DeviceSnapshot } from '@/nova/watching-profile-rules';

const watchlistArt = [
  { title: 'The Last Stand', meta: 'Action · 2024', img: 'https://images.pexels.com/photos/24286060/pexels-photo-24286060.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { title: 'Neon Nights', meta: 'Thriller · 2024', img: 'https://images.pexels.com/photos/29263907/pexels-photo-29263907.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { title: 'Crimson Hour', meta: 'Drama · 2023', img: 'https://images.pexels.com/photos/25746377/pexels-photo-25746377.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { title: 'Silent Frame', meta: 'Mystery · 2024', img: 'https://images.pexels.com/photos/18701501/pexels-photo-18701501.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { title: 'The Final Reel', meta: 'Noir · 2023', img: 'https://images.pexels.com/photos/35219288/pexels-photo-35219288.png?auto=compress&cs=tinysrgb&h=650&w=940' },
  { title: 'Encore', meta: 'Drama · 2024', img: 'https://images.pexels.com/photos/25746382/pexels-photo-25746382.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
];

const continueWatching: {
  title: string;
  contentType: 'series' | 'movie';
  season?: number;
  episode?: number;
  date?: string;
  remainingMinutes?: number;
  totalMinutes?: number;
  meta: string;
  img: string;
  progress: number;
}[] = [
  { title: 'Demon Slayer', contentType: 'series', season: 1, episode: 5, date: '21 Nov', remainingMinutes: 21, totalMinutes: 42, meta: '21m left', img: 'https://images.pexels.com/photos/23384428/pexels-photo-23384428.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', progress: 66 },
  { title: 'Shadow Protocol', contentType: 'movie', remainingMinutes: 86, totalMinutes: 132, meta: '1h 26m left', img: 'https://images.pexels.com/photos/19286437/pexels-photo-19286437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', progress: 40 },
  { title: 'Cars on Fire', contentType: 'series', season: 2, episode: 3, date: '18 Nov', remainingMinutes: 14, totalMinutes: 38, meta: '14m left', img: 'https://images.pexels.com/photos/28447604/pexels-photo-28447604.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', progress: 25 },
  { title: 'Crimson Veil', contentType: 'movie', remainingMinutes: 74, totalMinutes: 120, meta: '1h 14m left', img: 'https://images.pexels.com/photos/34707163/pexels-photo-34707163.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', progress: 80 },
];

type SettingItem = {
  label: string;
  detail: string;
  icon: typeof Settings2;
  arrow: 'right' | 'down';
};

const allSettings: SettingItem[] = [
  { label: 'Account', detail: 'Manage your account details', icon: CreditCard, arrow: 'right' },
  { label: 'Notifications', detail: 'Email and app alerts', icon: Bell, arrow: 'right' },
  { label: 'Parental Controls', detail: 'Content restrictions', icon: ShieldCheck, arrow: 'down' },
  { label: 'Help & Support', detail: '', icon: HelpCircle, arrow: 'right' },
];

type ProfileItem = StoredProfile;

export default function Profile({ onLogout, guest = false, onGuestBack, settingsRequest = 0, requestedSetting = null, bigScreen = false }: { onLogout: () => void; guest?: boolean; onGuestBack?: () => void; settingsRequest?: number; requestedSetting?: string | null; bigScreen?: boolean }) {

  const auth = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await auth.logout();
      onLogout();
    } catch {
      setLogoutError('Could not log out. Please try again.');
      setLoggingOut(false);
    }
  };
  const [view, setView] = useState<'profile' | 'settings' | 'upgrade' | 'account' | 'policy' | 'agreement'>(guest ? 'settings' : 'profile');
  const [phone] = useState(() => auth.user?.phone || loadCurrentPhone() || '+91 98765 43210');
  const [subscription, setSubscription] = useState<AccountSubscription>(() =>
    resolveFallbackSubscription(auth.user?.phone || loadCurrentPhone() || '+91 98765 43210'),
  );
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  useEffect(() => {
    let active = true;
    const fetchPlan = async () => {
      if (guest) return;
      setSubscriptionLoading(true);
      const clean = normalizePhoneNumber(phone);
      const hasDefaultPreviewPlan = !clean || clean === '9876543210' || isOldNovaUser(clean);
      try {
        const res = await getAccountSubscription({
          data: {
            phone,
            token: auth.session?.token,
            hasDefaultPreviewPlan,
          },
        });
        if (active && res) setSubscription(res);
      } catch {
        if (active) setSubscription(resolveFallbackSubscription(phone));
      } finally {
        if (active) setSubscriptionLoading(false);
      }
    };
    void fetchPlan();
    window.addEventListener('focus', fetchPlan);
    return () => {
      active = false;
      window.removeEventListener('focus', fetchPlan);
    };
  }, [phone, auth.session?.token, guest]);
  const [watchlist, setWatchlist] = useState<{ title: string; meta: string; img: string }[]>([]);
  useEffect(() => {
    const read = () => {
      const items: { title: string; meta: string; img: string }[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k?.startsWith('nova-watchlist:') || localStorage.getItem(k) !== 'true') continue;
          const title = k.slice('nova-watchlist:'.length);
          const art = watchlistArt.find((w) => w.title === title);
          items.push({ title, meta: art?.meta ?? 'Saved', img: art?.img ?? '' });
        }
      } catch { /* storage unavailable */ }
      setWatchlist(items);
    };
    read();
    window.addEventListener('storage', read);
    window.addEventListener('focus', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('focus', read); };
  }, []);
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ emailAlerts: true, appAlerts: true, newEpisodes: true, kidsPin: false });
  const [parentalPin, setParentalPin] = useState('');
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSent, setHelpSent] = useState(false);
  const [profiles, setProfilesState] = useState<ProfileItem[]>(defaultProfiles);
  const setProfiles = (update: ProfileItem[] | ((prev: ProfileItem[]) => ProfileItem[])) =>
    setProfilesState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      saveProfiles(next);
      return next;
    });
  const [activeProfileId, setActiveProfileId] = useState('p1');
  useEffect(() => {
    setProfilesState(loadProfiles());
    const a = loadActiveProfile();
    if (a) setActiveProfileId(a);
  }, []);
  const [profileDialog, setProfileDialog] = useState<StoredProfile | null>(null);
  const [editingProfiles, setEditingProfiles] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<DeviceSnapshot>(() => detectCurrentDevice());

  useEffect(() => {
    let active = true;
    let modelHint: string | undefined;
    let platformHint: string | undefined;
    const refreshDevice = () => {
      if (active) setCurrentDevice(detectCurrentDevice(modelHint, platformHint));
    };
    refreshDevice();
    const extras = getNavigatorDeviceExtras();
    extras?.userAgentData?.getHighEntropyValues?.(['model', 'platform', 'platformVersion'])
      .then((hints) => {
        modelHint = hints.model;
        platformHint = hints.platform;
        refreshDevice();
      })
      .catch(() => undefined);
    window.addEventListener('resize', refreshDevice);
    window.addEventListener('online', refreshDevice);
    window.addEventListener('offline', refreshDevice);
    window.addEventListener('focus', refreshDevice);
    document.addEventListener('visibilitychange', refreshDevice);
    extras?.connection?.addEventListener?.('change', refreshDevice);
    const interval = window.setInterval(refreshDevice, 30_000);
    return () => {
      active = false;
      window.removeEventListener('resize', refreshDevice);
      window.removeEventListener('online', refreshDevice);
      window.removeEventListener('offline', refreshDevice);
      window.removeEventListener('focus', refreshDevice);
      document.removeEventListener('visibilitychange', refreshDevice);
      extras?.connection?.removeEventListener?.('change', refreshDevice);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (requestedSetting && allSettings.some((s) => s.label === requestedSetting)) {
      setActiveSetting(requestedSetting);
      setView('settings');
    } else if (settingsRequest > 0) {
      setView('settings');
    }
  }, [settingsRequest, requestedSetting]);
  const deleteProfile = (id: string) => {
    const next = removeProfile(profiles, id);
    setProfiles(next);
    if (id === activeProfileId && next[0]) { setActiveProfileId(next[0].id); saveActiveProfile(next[0].id); }
  };


  const renderSettingContent = (label: string) => (
    <>
          {label === 'Notifications' && (
            <div className="divide-y divide-nova-line">
              {[
                    { key: 'emailAlerts', label: 'Email alerts', desc: 'Plan, offers and account updates' },
                    { key: 'appAlerts', label: 'App alerts', desc: 'New episodes and recommendations' },
                    { key: 'newEpisodes', label: 'New episode reminders', desc: 'Alerts when a series you watch releases new episodes' },
                  ].map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-nova-text">{row.label}</p>
                    <p className="mt-0.5 text-xs text-nova-muted">{row.desc}</p>
                  </div>
                  <Button variant="ghost"
                    onClick={() => setPrefs({ ...prefs, [row.key]: !prefs[row.key] })}
                    role="switch"
                    aria-checked={!!prefs[row.key]}
                    aria-label={row.label}
                    className={`relative h-6 w-11 shrink-0 rounded-full p-0 hover:bg-nova-line transition ${prefs[row.key] ? 'bg-nova-red' : 'bg-nova-line'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-nova-text transition-all ${prefs[row.key] ? 'left-[22px]' : 'left-0.5'}`} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {label === 'Parental Controls' && (
            <section className="py-4 text-nova-text">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Require PIN for Kids profile</p>
                  <p className="mt-1 text-xs text-nova-muted">{prefs['kidsPin'] && parentalPin ? 'PIN enabled for this session' : 'Protect your Kids profile with a 4-digit PIN'}</p>
                </div>
                <Button
                  variant="ghost"
                  role="switch"
                  aria-checked={!!prefs['kidsPin']}
                  onClick={() => { if (prefs['kidsPin']) { setPrefs({ ...prefs, kidsPin: false }); setParentalPin(''); } else setPinSetupOpen(true); }}
                  aria-label="Require PIN for Kids profile"
                  className={`relative h-6 w-11 shrink-0 rounded-full p-0 hover:bg-nova-line ${prefs['kidsPin'] ? 'bg-nova-red' : 'bg-nova-line'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-nova-text transition-all ${prefs['kidsPin'] ? 'left-[22px]' : 'left-0.5'}`} />
                </Button>
              </div>
              {pinSetupOpen && <ParentalPin onCancel={() => setPinSetupOpen(false)} onSave={(pin) => { setParentalPin(pin); setPrefs({ ...prefs, kidsPin: true }); setPinSetupOpen(false); }} />}
            </section>
          )}

          {label === 'Help & Support' && (
            <div className="text-nova-text">
              <div className="flex items-center gap-4 border-b border-nova-line pb-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-nova-card"><HelpCircle className="h-6 w-6" strokeWidth={1.5} /></span>
                <div><h2 className="text-lg font-semibold">NOVA Help Centre</h2><p className="mt-1 text-sm text-nova-muted">Account, membership &amp; settings</p></div>
              </div>
              <h3 className="mb-3 mt-5 text-sm font-semibold text-nova-muted">Request help</h3>
              {helpSent ? (
                <div className="py-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-nova-text"><Check className="h-4 w-4 text-nova-red" /> Request sent</p>
                  <p className="mt-2 text-sm text-nova-muted">Our team will reach you on your registered mobile number within 24 hours.</p>
                  <Button variant="ghost" onClick={() => setHelpSent(false)} className="mt-5 bg-white/10 text-white hover:bg-nova-line">Send another request</Button>
                </div>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(e) => { e.preventDefault(); setHelpSent(true); setHelpMessage(''); setHelpTopic(''); }}
                >
                  <div>
                    <label htmlFor="nova-help-topic" className="text-xs font-semibold text-nova-muted">What do you need help with?</label>
                    <select id="nova-help-topic" required value={helpTopic} onChange={(e) => setHelpTopic(e.target.value)} className="mt-2 w-full rounded-lg border border-nova-line bg-nova-black px-3 py-2.5 text-sm text-nova-text outline-none focus:border-nova-muted">
                      <option value="">Select an issue</option>
                      <option>Playback not working</option>
                      <option>Billing or plan</option>
                      <option>Account or mobile number</option>
                      <option>Something else</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="nova-help-msg" className="text-xs font-semibold text-nova-muted">Describe the issue</label>
                    <textarea id="nova-help-msg" required rows={4} value={helpMessage} onChange={(e) => setHelpMessage(e.target.value)} placeholder="Tell us what happened" className="mt-2 w-full resize-none rounded-lg border border-nova-line bg-nova-black px-3 py-2.5 text-sm text-nova-text placeholder:text-nova-muted outline-none focus:border-nova-muted" />
                  </div>
                  <Button type="submit" className="w-full bg-nova-text text-nova-black hover:bg-nova-text/90">Send request</Button>
                </form>
              )}
            </div>
          )}

    </>
  );

  const fetchedDateLabel = formatAccountDate(subscription.fetchedAt);
  const expiryDateLabel = formatAccountDate(subscription.expiresAt);

  const accountBody = (
    <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-xl bg-nova-dark p-4 sm:p-5 ring-1 ring-nova-line">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-semibold text-white sm:text-xl">{subscription.planName}</h1>
                {subscription.paid && (
                  <span
                    data-testid="account-plan-paid"
                    className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold tracking-wide text-emerald-300 ring-1 ring-emerald-400/40"
                  >
                    Paid
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/95" data-testid="account-plan-date">
                {subscriptionLoading && !expiryDateLabel && !fetchedDateLabel
                  ? 'Checking plan details...'
                  : subscription.paid && expiryDateLabel
                    ? `Valid till ${expiryDateLabel}`
                    : 'No active subscription'}
              </p>
            </div>
            {subscription.actionLabel && (
              <button
                type="button"
                onClick={() => setView('upgrade')}
                className="shrink-0 rounded-lg bg-white/10 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/15"
              >
                {subscription.actionLabel}
              </button>
            )}
          </div>

          <div className="flex items-start justify-between gap-3 rounded-xl bg-nova-dark p-4 sm:p-5 ring-1 ring-nova-line">
            <div>
              <p data-testid="account-full-phone" className="text-lg font-semibold tracking-wide text-white sm:text-xl">
                {formatFullPhone(phone)}
              </p>
              <p className="mt-1 text-sm text-white/95">Registered Mobile Number</p>
            </div>
          </div>

          <div className="rounded-xl bg-nova-dark p-4 sm:p-5 ring-1 ring-nova-line" data-testid="this-device-card">
            <h2 className="text-lg font-semibold text-white sm:text-xl">This Device</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className="relative">
                {currentDevice.category === 'tv' ? (
                  <Tv className="h-9 w-9 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" strokeWidth={1.5} />
                ) : currentDevice.category === 'tablet' ? (
                  <Tablet className="h-9 w-9 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" strokeWidth={1.5} />
                ) : currentDevice.category === 'desktop' ? (
                  <Monitor className="h-9 w-9 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" strokeWidth={1.5} />
                ) : (
                  <Smartphone className="h-9 w-9 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" strokeWidth={1.5} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white" data-testid="current-device-name">{currentDevice.name}</p>
                <p className="mt-0.5 truncate text-sm text-white/95" data-testid="current-device-meta">
                  Last used : Today
                </p>
              </div>
            </div>
          </div>

    </div>
  );

  if (view === 'account') {
    return (
      <div className="min-h-screen bg-[#0f1014] pb-28 pt-20 text-white lg:pb-12">
        <div className="mx-auto max-w-xl px-5">
          <button
            onClick={() => setView('settings')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ChevronRight className="h-4 w-4 rotate-180 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            Back
          </button>
          {accountBody}
        </div>
      </div>
    );
  }

  // TV/desktop: Settings & Help is portaled above SideRail and docked flush to the left edge.
  if (view === 'settings' && bigScreen && !guest) {
    const current = activeSetting ?? 'Account';
    const settingsOverlay = (
      <div className="fixed inset-0 top-16 z-[105] grid grid-cols-[290px_minmax(0,1fr)] bg-nova-black text-nova-text lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside data-testid="settings-side-panel" className="scrollbar-hide flex h-full flex-col overflow-y-auto border-r border-nova-line bg-nova-black px-5 py-5">
          <Button variant="novaRow" onClick={() => { setActiveSetting(null); setView('profile'); }} className="mb-2 w-fit gap-2 px-0 text-white hover:bg-transparent active:bg-transparent">
            <ChevronRight className="h-4 w-4 rotate-180 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> Back
          </Button>
          <h1 className="mb-4 text-xl font-bold text-white">Settings &amp; Help</h1>
          <nav className="flex flex-col gap-1" aria-label="Settings">
            {allSettings.map((item) => {
              const Icon = item.icon;
              const on = current === item.label;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setActiveSetting(item.label)}
                  aria-current={on ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${on ? 'bg-nova-card ring-1 ring-nova-accent/60' : 'hover:bg-nova-card/60'}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${on ? 'bg-nova-accent/20 text-white' : 'bg-nova-card text-white'}`}>
                    <Icon className="h-[18px] w-[18px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{item.label}</span>
                    {item.detail && (
                      <span className="mt-0.5 block truncate text-xs text-white/95">{item.detail}</span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                </button>
              );
            })}
          </nav>
          <div className="mt-auto pt-4">
            <Button variant="novaAction" onClick={handleLogout} disabled={loggingOut} className="nova-pill h-11 w-full gap-3 rounded-full text-white">
              <LogOut className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> {loggingOut ? 'Logging out…' : 'Logout'}
            </Button>
            {logoutError && <p role="alert" className="mt-2 text-sm text-nova-muted">{logoutError}</p>}
          </div>
        </aside>
        <section aria-label={current} className="scrollbar-hide h-full overflow-y-auto bg-nova-black p-5 lg:p-6">
          <div className="min-h-full w-full rounded-2xl bg-nova-black p-5 ring-1 ring-nova-line lg:p-7">
            <h2 className="mb-5 text-xl font-bold lg:text-2xl">{current}</h2>
            {current === 'Account' ? accountBody : renderSettingContent(current)}
          </div>
        </section>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(settingsOverlay, document.body) : settingsOverlay;
  }

  const sideItem = allSettings.find((s) => s.label === activeSetting && s.arrow === 'right' && s.label !== 'Account');
  if (view === 'settings' && sideItem) {
    return (
      <div className="min-h-screen bg-nova-black pb-28 pt-24 text-nova-text lg:pb-12 animate-in slide-in-from-right duration-300">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <Button variant="novaRow" onClick={() => setActiveSetting(null)} className="mb-6 gap-2 px-0 text-nova-muted hover:bg-transparent active:bg-transparent">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back
          </Button>
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{sideItem.label}</h1>
          {renderSettingContent(sideItem.label)}
        </div>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-nova-black pb-28 pt-24 text-nova-text lg:pb-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <Button variant="novaRow" onClick={() => (guest && onGuestBack ? onGuestBack() : setView('profile'))} className="mb-6 gap-2 px-0 text-nova-muted hover:bg-transparent active:bg-transparent">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back
          </Button>
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Settings &amp; Help</h1>

          <div className="divide-y divide-nova-line">
            {allSettings.filter((s) => !guest || s.label !== 'Account').map((item) => {
              const Icon = item.icon;
              const isAccount = item.label === 'Account';
              const isSide = item.arrow === 'right';
              const expanded = !isSide && activeSetting === item.label;
              const panelId = `setting-${item.label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
              return (
                <section key={item.label}>
                  <Button
                    variant="novaRow"
                    id={`${panelId}-trigger`}
                    aria-expanded={isSide ? undefined : expanded}
                    aria-controls={isSide ? undefined : panelId}
                    onClick={() => {
                      if (isAccount) setView('account');
                      else if (isSide) setActiveSetting(item.label);
                      else setActiveSetting(expanded ? null : item.label);
                    }}
                    className="group flex h-auto w-full items-center gap-3 rounded-lg px-1 py-5 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nova-card text-white">
                      <Icon className="h-[18px] w-[18px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                    </span>
                    <span className="min-w-0 flex-1 whitespace-normal">
                      <span className="block text-sm font-semibold text-white">{item.label}</span>
                      {item.detail && (
                        <span className="mt-0.5 block text-xs font-normal text-white/95">{item.detail}</span>
                      )}
                    </span>
                    {isSide ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                    ) : (
                      <ChevronDown className={`h-4 w-4 shrink-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    )}
                  </Button>
                  {expanded && (
                    <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`} className="pb-6 pl-1 pr-1 sm:pl-14 animate-in fade-in slide-in-from-top-2 duration-200">
                      {renderSettingContent(item.label)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          {!guest && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <Button variant="novaAction" onClick={handleLogout} disabled={loggingOut} className="nova-pill h-12 gap-3 rounded-full px-8 text-white">
                <LogOut className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> {loggingOut ? 'Logging out…' : 'Logout'}
              </Button>
              {logoutError && <p role="alert" className="text-sm text-white">{logoutError}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'policy') {
    return (
      <div className="min-h-screen bg-[#050505] pb-28 pt-24 text-white lg:pb-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-10">
          <button
            onClick={() => setView('settings')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ChevronRight className="h-4 w-4 rotate-180 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            Back
          </button>
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Privacy Policy</h1>
          <p className="text-sm leading-relaxed text-white/95">This policy explains what information NOVA collects and how it is used to run your streaming service.</p>
          {[
            { title: 'Information we collect', body: 'Your registered mobile number, plan and payment status, profiles, viewing activity and basic device details.' },
            { title: 'How we use it', body: 'To run your account, deliver and improve the service, and send the plan and episode alerts you choose in Notifications.' },
            { title: 'Sharing', body: 'We never sell your data. Details are shared only with payment and delivery partners, strictly to run the service.' },
            { title: 'Your choices', body: 'Update your number from Account, change alerts in Notifications, and delete a profile any time from Profile.' },
            { title: 'Contact', body: 'Open Help & Support in Settings & Help to send our team a request about your privacy.' },
          ].map((section) => (
            <section key={section.title} className="mt-6 border-t border-nova-line pt-5">
              <h2 className="text-sm font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/95">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'agreement') {
    return (
      <div className="min-h-screen bg-[#050505] pb-28 pt-24 text-white lg:pb-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-10">
          <button
            onClick={() => setView('settings')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ChevronRight className="h-4 w-4 rotate-180 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            Back
          </button>
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Subscriber Agreement</h1>
          <p className="text-sm leading-relaxed text-white/95">These terms apply when you use NOVA and any NOVA subscription plan.</p>
          {[
            { title: 'Your account', body: 'You sign in with your mobile number. Keep access to your account private and tell us if you notice anything unusual.' },
            { title: 'Plans and billing', body: 'Your plan renews for each billing period until you cancel. You can change or cancel your plan any time from Manage Subscription.' },
            { title: 'Using NOVA', body: 'Content is for personal, non-commercial viewing only. Copying, re-sharing or recording content is not allowed.' },
            { title: 'Content availability', body: 'Shows and channels may change over time and some titles may not be available in every region.' },
            { title: 'Ending the agreement', body: 'You can stop using NOVA at any time. We may suspend accounts that break these terms.' },
          ].map((section) => (
            <section key={section.title} className="mt-6 border-t border-nova-line pt-5">
              <h2 className="text-sm font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/95">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'upgrade') {
    const returnToAccount = () => {
      if (bigScreen) {
        setActiveSetting('Account');
        setView('settings');
      } else {
        setView('account');
      }
    };
    const isSubscribeFlow = subscription.actionLabel === 'Subscribe';
    const upgradeView = (
      <div className={bigScreen ? 'fixed inset-0 top-16 z-[105] overflow-y-auto bg-[#050505] pb-12 pt-8 text-white' : 'min-h-screen bg-[#050505] pb-28 pt-24 text-white lg:pb-12'}>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={returnToAccount}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ChevronRight className="h-4 w-4 rotate-180 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            Back
          </button>

          <div
            data-testid="upgrade-note-card"
            className="rounded-2xl border border-nova-line bg-gradient-to-b from-[#151320] to-[#0a0a0f] p-6 shadow-2xl sm:p-8"
          >
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {isSubscribeFlow ? 'Subscribe to NOVA' : 'Upgrade Plan'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-white/90">
              <span className="font-semibold text-white">{subscription.planName}</span>
              {subscription.paid && (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/40">
                  Paid
                </span>
              )}
            </div>
            <div className="my-5 h-px bg-white/10" />
            <p className="text-sm leading-relaxed text-white/95 sm:text-base">
              {isSubscribeFlow
                ? 'Plans and memberships cannot be purchased directly on this screen. To subscribe to NOVA, visit our platform on your mobile or web browser using your registered mobile number.'
                : 'Your current plan is active. To upgrade to NOVA Premium or manage your subscription, visit our platform on your mobile or web browser using your registered mobile number.'}
            </p>
          </div>
        </div>
      </div>
    );
    return bigScreen && typeof document !== 'undefined' ? createPortal(upgradeView, document.body) : upgradeView;
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-28 pt-24 text-white lg:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">Profile</h1>

        <section className="overflow-hidden rounded-3xl bg-[#050505] shadow-2xl shadow-black/40">
          <div className="relative px-5 pb-7 pt-6 sm:px-8 sm:pt-8">
            <div className="relative flex flex-wrap items-start justify-center gap-6 sm:gap-10">
              {profiles.map((pf) => {
                const isActive = pf.id === activeProfileId;
                return (
                  <div key={pf.id} className="flex flex-col items-center gap-3 text-center">
                    <button
                      onClick={() => (editingProfiles ? setProfileDialog(pf) : setActiveProfileId(pf.id))}
                      aria-label={editingProfiles ? `Change ${pf.name}` : `Select ${pf.name}`}
                      className="group flex flex-col items-center gap-3 text-center"
                    >
                      <span className="relative block rounded-full transition group-hover:scale-105">
                        <ProfileBadge profile={pf} className={isActive ? 'ring-2 ring-white' : 'ring-1 ring-white/25'} />
                        {editingProfiles && <span className="absolute inset-0 rounded-full bg-nova-black/35" />}
                      </span>
                      <span className="text-sm font-semibold text-white transition">{pf.name}</span>
                    </button>
                    {editingProfiles && <ProfileEditActions name={pf.name} onEdit={() => setProfileDialog(pf)} onDelete={() => deleteProfile(pf.id)} canDelete={profiles.length > 1} />}
                  </div>
                );
              })}

              <button
                onClick={() => setProfileDialog(createProfileDraft(profiles, `p${Date.now()}`))}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-white/[0.04] text-white transition hover:border-white hover:text-white sm:h-28 sm:w-28">
                  <Plus className="h-10 w-10 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-white transition">Add Profile</span>
              </button>
            </div>
            <div className="mt-7 flex justify-center">
              <button
                onClick={() => setEditingProfiles((e) => !e)}
                aria-pressed={editingProfiles}
                className="nova-pill inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-125"
              >
                {editingProfiles ? <Check className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> : <Edit3 className="h-3.5 w-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />}
                {editingProfiles ? 'Done' : 'Edit Profile'}
              </button>
            </div>

          </div>
        </section>

        {!bigScreen && <section className="mt-6 flex justify-center">
          <button
            onClick={() => setView('account')}
            className="nova-pill group inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white transition hover:brightness-125"
          >
            Account &amp; Plan
          </button>
        </section>}

        <section className="mt-6">
          <h2 className="mb-3 px-1 text-xl font-bold text-white">Continue Watching</h2>
          <div className="tv-scroll-row grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1].map((i) => {
              const item = continueWatching[i % continueWatching.length]!;
              const showSerialMeta = item.contentType === 'series' && item.season != null && item.episode != null;
              const showMovieMeta = item.contentType === 'movie';
              return (
                <div key={i}>
                  <button data-tv-focusable="true" aria-label={`Resume ${item.title}`} className="tv-focusable group relative block w-full overflow-hidden rounded-xl bg-[#0a0a0a] text-left hover:bg-[#111111]">
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={item.img}
                        alt=""
                        className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:opacity-100 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f1219]/[0.92] transition group-hover:scale-110 group-hover:bg-[#e50914]/80">
                          <Play className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" fill="currentColor" />
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 h-0.5 bg-[#e50914]" style={{ width: `${item.progress}%` }} />
                    </div>
                  </button>
                  {showSerialMeta && (
                    <div data-testid="continue-serial-meta" className="mt-2 px-0.5">
                      <p className="text-xs font-semibold text-white">
                        {`S${item.season} E${item.episode} · ${item.date ?? '21 Nov'}`}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium tabular-nums text-white/75">
                        {getRemainingMinutesLabel(item.title, item.totalMinutes ?? 42, item.remainingMinutes)}
                      </p>
                    </div>
                  )}
                  {showMovieMeta && (
                    <div data-testid="continue-movie-meta" className="mt-2 px-0.5">
                      <p className="truncate text-xs font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium tabular-nums text-white/75">
                        {getRemainingMinutesLabel(item.title, item.totalMinutes ?? 120, item.remainingMinutes ?? 86)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <NotificationStrip />

        {watchlist.length > 0 && <section className="mt-6">
          <h2 className="mb-3 px-1 text-xl font-bold text-white">My Watchlist</h2>
          <div className="tv-scroll-row flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {watchlist.map((item, i) => (
              <button key={i} data-tv-focusable="true" aria-label={`Open ${item.title}`} className="tv-focusable group relative block w-36 shrink-0 overflow-hidden rounded-xl bg-[#0a0a0a] text-left hover:bg-[#111111] sm:w-44">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  {item.img ? <img
                    src={item.img}
                    alt=""
                    className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:opacity-100 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  /> : <div className="h-full w-full bg-gradient-to-br from-violet-700 via-fuchsia-700 to-nova-black" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </button>
            ))}
          </div>
        </section>}

        {!bigScreen && <section className="mt-8 flex justify-center">
          <button
            onClick={() => setView('settings')}
            className="nova-pill rounded-full px-8 py-3 text-center text-sm font-bold text-white transition hover:brightness-125"
          >
            Settings &amp; Help
          </button>
        </section>}

        {profileDialog && <ProfileEditor profile={profileDialog} onCancel={() => setProfileDialog(null)} onSave={profile => {
          setProfiles(existing => existing.some(p => p.id === profile.id) ? existing.map(p => p.id === profile.id ? profile : p) : insertBeforeKids(existing, profile));
          setActiveProfileId(profile.id);
          saveActiveProfile(profile.id);
          setProfileDialog(null);
        }} />}

      </div>
    </div>

  );
}
