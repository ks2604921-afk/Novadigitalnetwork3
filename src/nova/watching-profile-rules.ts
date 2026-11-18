import { z } from 'zod';

export const avatarIds = ['orbit', 'fox', 'panda', 'cat', 'robot', 'lion'] as const;
export const watchingProfileSchema = z.object({
  name: z.string().trim().min(1, 'Enter a profile name.').max(20, 'Use up to 20 characters.'),
  avatar: z.enum(avatarIds),
  kid: z.boolean().default(false),
});
export type WatchingProfile = z.infer<typeof watchingProfileSchema> & { id: string };

const TV_UA = /\bTV\b|SmartTV|Smart-TV|Tizen|WebOS|Web0S|HbbTV|GoogleTV|Google TV|Android TV|AFT[A-Z]|FireTV|BRAVIA|CrKey|Roku|NetCast|MiTV|MiBOX|Leanback|VIDAA|AppleTV|SHIELD|Viera|Hisense|PhilipsTV/i;
const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile/i;

export function isTvUserAgent(userAgent: string) {
  return TV_UA.test(userAgent);
}

/** The on-screen number keypad is only for TV screens (remote control). */
export function shouldShowKeypad(userAgent: string) {
  return isTvUserAgent(userAgent);
}

/** Desktop = mouse-driven, wide, non-TV, non-mobile browser. */
export function isDesktopDevice(userAgent: string, finePointer: boolean, width: number) {
  return !isTvUserAgent(userAgent) && !MOBILE_UA.test(userAgent) && finePointer && width >= 1024;
}

export type DeviceCategory = 'tv' | 'mobile' | 'tablet' | 'desktop';

export type DeviceSnapshot = {
  category: DeviceCategory;
  name: string;
  browser: string;
  platform: string;
  screen: string;
  online: boolean;
  network?: string;
};

type NavigatorUAData = {
  platform?: string;
  mobile?: boolean;
  getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platform?: string; platformVersion?: string }>;
};

type NavigatorWithExtras = Navigator & {
  userAgentData?: NavigatorUAData;
  connection?: {
    effectiveType?: string;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
};

function detectBrowserName(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser\//i.test(ua)) return 'Samsung Internet';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua)) return 'Safari';
  return 'Web Browser';
}

function detectBaseDevice(ua: string, platformRaw: string, maxTouchPoints: number): { category: DeviceCategory; name: string; platform: string } {
  if (isTvUserAgent(ua)) {
    if (/BRAVIA/i.test(ua)) return { category: 'tv', name: 'Sony BRAVIA TV', platform: 'Android TV' };
    if (/AFT[A-Z]/i.test(ua)) return { category: 'tv', name: 'Amazon Fire TV', platform: 'Fire OS' };
    if (/Tizen/i.test(ua)) return { category: 'tv', name: 'Samsung Smart TV', platform: 'Tizen' };
    if (/WebOS|Web0S/i.test(ua)) return { category: 'tv', name: 'LG webOS TV', platform: 'webOS' };
    if (/Roku/i.test(ua)) return { category: 'tv', name: 'Roku TV', platform: 'Roku OS' };
    if (/Android TV|GoogleTV/i.test(ua)) return { category: 'tv', name: 'Android TV', platform: 'Android TV' };
    return { category: 'tv', name: 'Smart TV', platform: 'Smart TV' };
  }
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1)) {
    return { category: 'tablet', name: 'iPad', platform: 'iPadOS' };
  }
  if (/iPhone/i.test(ua)) {
    return { category: 'mobile', name: 'iPhone', platform: 'iOS' };
  }
  if (/Android/i.test(ua)) {
    const mobile = /Mobile/i.test(ua);
    return { category: mobile ? 'mobile' : 'tablet', name: mobile ? 'Android Phone' : 'Android Tablet', platform: 'Android' };
  }
  const combined = `${platformRaw} ${ua}`;
  if (/Win/i.test(combined)) return { category: 'desktop', name: 'Windows PC', platform: 'Windows' };
  if (/Mac/i.test(combined)) return { category: 'desktop', name: 'Mac', platform: 'macOS' };
  if (/CrOS/i.test(combined)) return { category: 'desktop', name: 'Chromebook', platform: 'ChromeOS' };
  if (/Linux/i.test(combined)) return { category: 'desktop', name: 'Linux PC', platform: 'Linux' };
  return { category: 'desktop', name: 'Browser Device', platform: platformRaw || 'Web' };
}

export function detectCurrentDevice(modelOverride?: string, platformOverride?: string): DeviceSnapshot {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      category: 'desktop',
      name: 'Web Browser',
      browser: 'Web Browser',
      platform: 'Web',
      screen: '1920 × 1080',
      online: true,
    };
  }
  const nav = navigator as NavigatorWithExtras;
  const ua = nav.userAgent || '';
  const platformRaw = platformOverride || nav.userAgentData?.platform || nav.platform || '';
  const maxTouchPoints = typeof nav.maxTouchPoints === 'number' ? nav.maxTouchPoints : 0;
  const base = detectBaseDevice(ua, platformRaw, maxTouchPoints);
  const cleanModel = modelOverride?.trim();
  const name = cleanModel ? `${cleanModel} · ${base.name}` : base.name;
  const screen = `${window.innerWidth} × ${window.innerHeight}`;
  const network = nav.connection?.effectiveType;
  return {
    category: base.category,
    name,
    browser: detectBrowserName(ua),
    platform: base.platform,
    screen,
    online: typeof nav.onLine === 'boolean' ? nav.onLine : true,
    ...(network ? { network } : {}),
  };
}

export function getNavigatorDeviceExtras(): NavigatorWithExtras | null {
  if (typeof navigator === 'undefined') return null;
  return navigator as NavigatorWithExtras;
}
