import { orderProfiles } from '@/nova/profile-rules';

export type StoredProfile = { id: string; name: string; grad: string; kid: boolean; avatar?: string; languages?: string[] };

const KEY = 'nova.profiles';
const ACTIVE_KEY = 'nova.activeProfile';
const ACTIVITY_KEY = 'nova.profileActivity';

export const defaultProfiles: StoredProfile[] = [
  { id: 'p1', name: 'Pranaay Mi', grad: 'from-violet-500 via-fuchsia-600 to-indigo-900', kid: false },
  { id: 'p2', name: 'Kids', grad: 'from-amber-400 via-orange-500 to-pink-500', kid: true },
];

export function loadProfiles(): StoredProfile[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as StoredProfile[]) : null;
    return Array.isArray(list) && list.length ? orderProfiles(list) : defaultProfiles;
  } catch {
    return defaultProfiles;
  }
}

export function saveProfiles(list: StoredProfile[]) {
  try { localStorage.setItem(KEY, JSON.stringify(orderProfiles(list))); } catch { /* ignore */ }
}

export function loadActiveProfile(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

export function loadProfileActivity(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function touchProfileActivity(id: string) {
  try {
    const current = loadProfileActivity();
    current[id] = Date.now();
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(current));
  } catch { /* ignore */ }
}

export function formatLastActive(id: string, index: number, activity: Record<string, number>, now = Date.now()): string {
  const ts = activity[id];
  if (typeof ts !== 'number') {
    if (index === 0) return 'Last watched 2h ago';
    return index === 1 ? 'Last watched yesterday' : 'Last watched recently';
  }
  const diffMin = Math.max(0, Math.floor((now - ts) / 60000));
  if (diffMin < 1) return 'Active just now';
  if (diffMin < 60) return `Last watched ${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Last watched ${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return diffDay === 1 ? 'Last watched yesterday' : `Last watched ${diffDay}d ago`;
}

export function saveActiveProfile(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
  touchProfileActivity(id);
}
