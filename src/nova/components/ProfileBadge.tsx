import AvatarArt from '@/nova/components/AvatarArt';
import type { StoredProfile } from '@/nova/profile-store';

/** One avatar look for every profile, shared by profile selection and the Profile page. */
export default function ProfileBadge({ profile, className = '' }: { profile: Pick<StoredProfile, 'avatar' | 'grad' | 'kid'>; className?: string }) {
  return (
    <span className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${profile.grad} text-4xl shadow-xl sm:h-28 sm:w-28 ${className}`}>
      <AvatarArt avatar={profile.avatar} kid={profile.kid} />
    </span>
  );
}
