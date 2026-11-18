import { Fragment, useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { navItemsFor } from '@/nova/navigation';
import AiChatButton from '@/nova/components/AiChat';

type BottomNavProps = {
  activeNav: string;
  onNavChange: (id: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  view: 'main' | 'category' | 'all-categories';
  onOpenAllCategories: () => void;
  bigScreen?: boolean;
};

const categories = ['TV', 'Series', 'Sports'];

// The category pill stays hidden until the home page is scrolled this far down.
export const SCROLL_REVEAL_PX = 140;

const Divider = () => <span aria-hidden className="h-5 w-px shrink-0 bg-white/15" />;

export default function BottomNav({
  activeNav,
  onNavChange,
  onCategoryChange,
  view,
  onOpenAllCategories,
  bigScreen = false,
}: BottomNavProps) {
  const navItems = navItemsFor(bigScreen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= SCROLL_REVEAL_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On the home page the pill only appears once the user has scrolled a little.
  const [chatOpen, setChatOpen] = useState(false);
  const onHome = activeNav === 'home' && view === 'main';
  const showCategories = onHome && !chatOpen && scrolled;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 nova-bottom-nav">
      <div
        className={`flex justify-center px-3 overflow-hidden transition-all duration-300 ${
          onHome ? 'max-h-32 pb-2 pt-2' : 'pointer-events-none max-h-0 opacity-0 pb-0'
        }`}
      >
        {onHome && !chatOpen && (
          <div aria-hidden={!showCategories} inert={!showCategories} className={`transition-all duration-300 ${showCategories ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-0.5 rounded-full border border-white/12 bg-[#0f1219]/[0.92] p-1 shadow-2xl shadow-black/40">
            {categories.map((label, index) => {
              const active = false;
              return (
                <Fragment key={label}>
                  {index > 0 && <Divider />}
                  <button
                    onClick={() => onCategoryChange(label)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      active
                        ? 'nova-pill-solid text-white shadow-inner'
                        : 'text-white hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                </Fragment>
              );
            })}
            <Divider />
            <button
              onClick={onOpenAllCategories}
              aria-label="Open all categories"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-all hover:bg-white/10 hover:text-white"
            >
              <ChevronUp className="h-4 w-4 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" strokeWidth={2.4} />
            </button>
          </div>
          </div>
        )}
        {onHome && (
          <div className="ml-8 flex w-[7.5rem] shrink-0 items-center justify-start">
            <AiChatButton className="self-center" onOpenChange={setChatOpen} />
          </div>
        )}
      </div>

      <div className="nova-nav-bar">
        <div className="flex h-[70px] items-stretch justify-around px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-3 transition-colors"
              >
                <Icon
                  className={`h-5 w-5 text-white transition-all ${
                    active
                      ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]'
                      : 'drop-shadow-[0_0_5px_rgba(255,255,255,0.55)]'
                  }`}
                  strokeWidth={active ? 2.3 : 2}
                />
                <span className="max-w-[72px] truncate text-[10px] font-medium text-white transition-colors">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </nav>
  );
}
