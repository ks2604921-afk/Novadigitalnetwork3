const REGISTERED_PHONES_KEY = 'nova-registered-phones';
const ACTIVE_PHONE_KEY = 'nova-active-phone';

/** Pre-existing registered NOVA user numbers routed directly to profile selection. */
export const SEEDED_OLD_USER_PHONES = ['8092153438'] as const;

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

export function loadRegisteredPhones(): string[] {
  const phones = new Set<string>(SEEDED_OLD_USER_PHONES);
  try {
    const raw = localStorage.getItem(REGISTERED_PHONES_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string') {
            const clean = normalizePhoneNumber(item);
            if (clean.length === 10) phones.add(clean);
          }
        }
      }
    }
  } catch {
    /* storage unavailable */
  }
  return Array.from(phones);
}

export function isOldNovaUser(phone: string): boolean {
  const clean = normalizePhoneNumber(phone);
  if (clean.length !== 10) return false;
  return loadRegisteredPhones().includes(clean);
}

export function registerNovaPhone(phone: string): void {
  const clean = normalizePhoneNumber(phone);
  if (clean.length !== 10) return;
  try {
    const current = loadRegisteredPhones().filter(
      (p) => !(SEEDED_OLD_USER_PHONES as readonly string[]).includes(p),
    );
    if (!current.includes(clean)) current.push(clean);
    localStorage.setItem(REGISTERED_PHONES_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable */
  }
}

export function saveCurrentPhone(phone: string): void {
  const clean = normalizePhoneNumber(phone);
  try {
    if (clean) localStorage.setItem(ACTIVE_PHONE_KEY, clean);
    else localStorage.removeItem(ACTIVE_PHONE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function loadCurrentPhone(): string {
  try {
    return normalizePhoneNumber(localStorage.getItem(ACTIVE_PHONE_KEY) ?? '');
  } catch {
    return '';
  }
}

export function clearCurrentPhone(): void {
  try {
    localStorage.removeItem(ACTIVE_PHONE_KEY);
  } catch {
    /* storage unavailable */
  }
}
