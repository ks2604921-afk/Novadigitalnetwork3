import { Settings2 } from 'lucide-react';
import Logo from '@/nova/components/Logo';

export default function Navbar({ onSettings }: { onSettings?: (() => void) | undefined }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[110] bg-gradient-to-b from-[#0f1219]/[0.92] via-[#0f1219]/75 to-transparent">
      <div className="relative flex h-16 items-center justify-between px-5 lg:px-8">
        <Logo />
        <div className="flex items-center gap-2.5">
          {onSettings && (
            <button
              type="button"
              data-tv-focusable="true"
              onClick={onSettings}
              className="tv-focusable flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 hover:text-white"
            >
              <Settings2 className="h-4 w-4 text-white" /> Settings &amp; Help
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
