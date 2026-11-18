export function orderProfiles<T extends { kid: boolean }>(profiles: T[]): T[] {
  return [...profiles.filter((profile) => !profile.kid), ...profiles.filter((profile) => profile.kid)];
}

export function insertBeforeKids<T extends { kid: boolean }>(profiles: T[], profile: T): T[] {
  return orderProfiles([...profiles, profile]);
}

export const TRIAL_OFFER = {
  priceRupees: 1,
  durationMonths: 1,
  renewalPriceRupees: 40,
  renewalIntervalMonths: 1,
  renewalPlan: 'Standard',
} as const;
/** Gradients new profiles cycle through, shared by profile selection and the Profile page. */
export const PROFILE_GRADS = [
  'from-red-500 via-red-700 to-red-950',
  'from-amber-400 via-orange-500 to-pink-500',
  'from-violet-500 via-purple-700 to-indigo-950',
  'from-teal-400 via-cyan-600 to-blue-900',
  'from-emerald-400 via-green-600 to-teal-900',
] as const;

/** Avatars offered in the shared avatar slider: 1 normal plus 9 Iron Man & anime character avatars. */
export const PROFILE_AVATARS = [
  'normal',
  'iron-hero',
  'anime-boy-shadow',
  'anime-boy-flame',
  'anime-boy-cyber',
  'anime-boy-neon',
  'anime-girl-sakura',
  'anime-girl-cyber',
  'anime-girl-starlight',
  'anime-girl-crimson',
] as const;

export const AVATAR_LABELS: Record<(typeof PROFILE_AVATARS)[number], string> = {
  normal: 'Normal',
  'iron-hero': 'Iron Hero',
  'anime-boy-shadow': 'Anime Boy Shadow',
  'anime-boy-flame': 'Anime Boy Flame',
  'anime-boy-cyber': 'Anime Boy Cyber',
  'anime-boy-neon': 'Anime Boy Neon',
  'anime-girl-sakura': 'Anime Girl Sakura',
  'anime-girl-cyber': 'Anime Girl Cyber',
  'anime-girl-starlight': 'Anime Girl Starlight',
  'anime-girl-crimson': 'Anime Girl Crimson',
};

export function getAvatarLabel(avatar: string): string {
  return (AVATAR_LABELS as Record<string, string>)[avatar] ?? avatar;
}

export function createProfileDraft(profiles: readonly unknown[], id: string) {
  return { id, name: '', avatar: PROFILE_AVATARS[0] as string, grad: PROFILE_GRADS[profiles.length % PROFILE_GRADS.length] as string, kid: false };
}

/** Deletes a profile, but never the last remaining one. */
export function removeProfile<T extends { id: string }>(profiles: T[], id: string): T[] {
  if (profiles.length <= 1) return profiles;
  return profiles.filter((profile) => profile.id !== id);
}
