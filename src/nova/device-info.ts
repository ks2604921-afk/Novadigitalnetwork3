import { useCallback, useEffect, useState } from 'react';
import { isTvUserAgent } from '@/nova/watching-profile-rules';

export type DeviceKind = 'tv' | 'mobile' | 'tablet' | 'desktop';

export type LiveDeviceInfo = {
  name: string;
  kind: DeviceKind;
  os: string;
  browser: string;
  screen: string;
  online: boolean;
  lastUsed: string;
};

type UaDataHints = {
  model?: string;
  platform?: string;
  platformVersion?: string;
  mobile?: boolean;
};

type NavigatorWithUaData = Navigator & {
  userAgentData?: {
    platform?: string;
    mobile?: boolean;
    getHighEntropyValues?: (hints: string[]) => Promise<UaDataHints>;
  };
};

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS/i.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS/i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua)) return 'Safari';
  return 'Browser';
}

function detectOs(ua: string, platformHint?: string, platformVersion?: string): string {
  if (platformHint === 'Windows' && platformVersion) {
    const major = Number.parseInt(platformVersion.split('.')[0] ?? '', 10);
    if (Number.isFinite(major) && major >= 13) return 'Windows 11';
    if (Number.isFinite(major) && major > 0) return 'Windows 10';
  }
  const androidMatch = ua.match(/Android\s+([0-9.]+)/i);
  if (androidMatch?.[1]) return `Android ${androidMatch[1]}`;
  if (/Android/i.test(ua)) return 'Android';
  const iosMatch = ua.match(/(?:iPhone|CPU(?:\s+iPhone)?)\s+OS\s+([0-9_]+)/i);
  if (iosMatch?.[1]) {
    const ver = iosMatch[1].replace(/_/g, '.');
    return /iPad/i.test(ua) ? `iPadOS ${ver}` : `iOS ${ver}`;
  }
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  const macMatch = ua.match(/Mac OS X\s+([0-9_]+)/i);
  if (macMatch?.[1]) return `macOS ${macMatch[1].replace(/_/g, '.')}`;
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Windows NT 10\.0/i.test(ua)) return 'Windows 10/11';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Tizen/i.test(ua)) return 'Tizen OS';
  if (/WebOS|Web0S/i.test(ua)) return 'LG webOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return platformHint || 'Unknown OS';
}

function detectKindAndName(ua: string, modelHint?: string): { kind: DeviceKind; name: string } {
  const cleanModel = modelHint?.trim();
  if (isTvUserAgent(ua)) {
    if (cleanModel) return { kind: 'tv', name: cleanModel };
    if (/BRAVIA/i.test(ua)) return { kind: 'tv', name: 'Sony BRAVIA TV' };
    if (/Tizen/i.test(ua)) return { kind: 'tv', name: 'Samsung Smart TV' };
    if (/WebOS|Web0S/i.test(ua)) return { kind: 'tv', name: 'LG webOS TV' };
    if (/AFT[A-Z]/i.test(ua)) return { kind: 'tv', name: 'Amazon Fire TV' };
    if (/Roku/i.test(ua)) return { kind: 'tv', name: 'Roku TV' };
    if (/Android TV|GoogleTV/i.test(ua)) return { kind: 'tv', name: 'Android TV' };
    return { kind: 'tv', name: 'Smart TV' };
  }
  if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || /Tablet|Silk|PlayBook/i.test(ua)) {
    return { kind: 'tablet', name: cleanModel || (/iPad/i.test(ua) ? 'iPad' : 'Android Tablet') };
  }
  if (/iPhone|iPod|Mobile/i.test(ua)) {
    if (cleanModel) return { kind: 'mobile', name: cleanModel };
    if (/iPhone/i.test(ua)) return { kind: 'mobile', name: 'iPhone' };
    const pixel = ua.match(/(Pixel\s*[A-Za-z0-9 ]+)/i);
    if (pixel?.[1]) return { kind: 'mobile', name: `Google ${pixel[1].trim()}` };
    const samsung = ua.match(/(SM-[A-Z0-9]+)/i);
    if (samsung?.[1]) return { kind: 'mobile', name: `Samsung ${samsung[1]}` };
    return { kind: 'mobile', name: 'Android Phone' };
  }
  if (/CrOS/i.test(ua)) return { kind: 'desktop', name: cleanModel || 'Chromebook' };
  if (/Macintosh|Mac OS X/i.test(ua)) return { kind: 'desktop', name: cleanModel || 'Mac' };
  if (/Windows/i.test(ua)) return { kind: 'desktop', name: cleanModel || 'Windows PC' };
  if (/Linux/i.test(ua)) return { kind: 'desktop', name: cleanModel || 'Linux PC' };
  return { kind: 'desktop', name: cleanModel || 'Web Browser' };
}

function formatNow(): string {
  try {
    return `Today · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Today';
  }
}

export function readSyncDeviceInfo(hints?: UaDataHints): LiveDeviceInfo {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return {
      name: 'Web Device',
      kind: 'desktop',
      os: 'Browser',
      browser: 'Web',
      screen: '',
      online: true,
      lastUsed: 'Today',
    };
  }
  const nav = navigator as NavigatorWithUaData;
  const ua = nav.userAgent || '';
  const { kind, name } = detectKindAndName(ua, hints?.model);
  const os = detectOs(ua, hints?.platform || nav.userAgentData?.platform, hints?.platformVersion);
  const browser = detectBrowser(ua);
  const width = window.screen?.width || window.innerWidth || 0;
  const height = window.screen?.height || window.innerHeight || 0;
  const screen = width > 0 && height > 0 ? `${width}×${height}` : '';
  return {
    name,
    kind,
    os,
    browser,
    screen,
    online: nav.onLine ?? true,
    lastUsed: formatNow(),
  };
}

export function useLiveDeviceInfo() {
  const [info, setInfo] = useState<LiveDeviceInfo>(() => readSyncDeviceInfo());
  const [hints, setHints] = useState<UaDataHints | undefined>();

  const refresh = useCallback(async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithUaData) : undefined;
    let nextHints = hints;
    if (nav?.userAgentData?.getHighEntropyValues) {
      try {
        nextHints = await nav.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion', 'mobile']);
        setHints(nextHints);
      } catch {
        /* client hints unavailable */
      }
    }
    setInfo(readSyncDeviceInfo(nextHints));
  }, [hints]);

  useEffect(() => {
    void refresh();
    const syncUpdate = () => setInfo(readSyncDeviceInfo(hints));
    window.addEventListener('online', syncUpdate);
    window.addEventListener('offline', syncUpdate);
    window.addEventListener('resize', syncUpdate);
    document.addEventListener('visibilitychange', syncUpdate);
    return () => {
      window.removeEventListener('online', syncUpdate);
      window.removeEventListener('offline', syncUpdate);
      window.removeEventListener('resize', syncUpdate);
      document.removeEventListener('visibilitychange', syncUpdate);
    };
  }, [hints, refresh]);

  return { device: info, refresh };
}
