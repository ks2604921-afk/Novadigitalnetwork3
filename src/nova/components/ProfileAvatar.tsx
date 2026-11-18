import { Orbit } from 'lucide-react';
import type { WatchingProfile } from '@/nova/watching-profile-rules';

const symbols: Record<WatchingProfile['avatar'], string> = { orbit: '', fox: '🦊', panda: '🐼', cat: '🐱', robot: '🤖', lion: '🦁' };
export default function ProfileAvatar({ avatar }: { avatar: WatchingProfile['avatar'] }) {
  return <span className={`nova-avatar nova-avatar-${avatar} flex h-full w-full items-center justify-center rounded-full text-4xl`}>
    {avatar === 'orbit' ? <Orbit className="h-12 w-12 text-nova-text" strokeWidth={1.3} /> : <span aria-hidden>{symbols[avatar]}</span>}
  </span>;
}