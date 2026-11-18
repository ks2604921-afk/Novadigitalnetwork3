import { useState } from 'react';
import { LayoutGrid, Tv, Baby, Volleyball, Film, Clapperboard } from 'lucide-react';
import { navItemsFor } from '@/nova/navigation';

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

type SideRailProps = {
  activeNav: string;
  onNavChange: (id: string) => void;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  onOpenCategories: () => void;
  categoriesActive: boolean;
  bigScreen?: boolean;
  onPickCategory?: (category: string) => void;
  /** Category currently open from the rail (e.g. 'TV'), so its item shows as active. */
  activeQuick?: string | undefined;
};

// Quick categories that drop down under TV on TV/desktop hover or remote focus.
const QUICK_CATEGORIES: { id: string; label: string; icon: IconType }[] = [
  { id: 'Series', label: 'Series', icon: Film },
  { id: 'Sports', label: 'Sports', icon: Volleyball },
  { id: 'Kids', label: 'Kids', icon: Baby },
  { id: 'Movies', label: 'Movies', icon: Clapperboard },
];

// Glass navigation rail for tablet/desktop. It opens by itself when the mouse
// moves over it, and keeps Profile pinned at the very bottom.
export default function SideRail({
  activeNav,
  onNavChange,
  expanded,
  onExpandedChange,
  onOpenCategories,
  categoriesActive,
  bigScreen = false,
  onPickCategory,
  activeQuick,
}: SideRailProps) {
  const [catOpen, setCatOpen] = useState(false);
  const showQuick = bigScreen && !!onPickCategory;
  const navItems = navItemsFor(bigScreen);
  const mainItems = navItems.filter((item) => item.id !== 'profile');
  const profileItem = navItems.find((item) => item.id === 'profile');

  const renderItem = (
    id: string,
    label: string,
    Icon: IconType,
    active: boolean,
    onSelect: () => void,
  ) => (
    <button
      key={id}
      type="button"
      data-tv-focusable="true"
      onClick={onSelect}
      title={expanded ? undefined : label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`tv-focusable group relative flex h-12 items-center gap-4 overflow-visible rounded-full px-3.5 ${
        active
          ? 'nova-pill-solid text-white'
          : 'text-white hover:bg-white/[0.08] hover:text-white'
      }`}
    >
      <span className="flex shrink-0">
      <Icon
        className={`h-5 w-5 shrink-0 text-white ${
          active
            ? 'opacity-100'
            : 'opacity-90 group-hover:opacity-100'
        }`}
        strokeWidth={active ? 2.3 : 2}
      />
      </span>
      <span
        className={`whitespace-nowrap text-sm font-semibold tracking-wide transition-opacity duration-150 ${
          expanded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {label}
      </span>
    </button>
  );

  return (
    <aside
      data-tv-region="rail"
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
      onFocusCapture={() => onExpandedChange(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onExpandedChange(false);
      }}
      className={`fixed left-3 top-20 bottom-4 z-[60] hidden flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0f1219]/[0.92] py-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)] transition-[width] duration-200 will-change-[width] md:flex ${
        expanded ? 'w-52' : 'w-[68px]'
      }`}
    >
      <nav className="relative flex flex-col gap-2 px-2.5">
        {mainItems.map((item) => (
          <div key={item.id} className="contents">
            {renderItem(
              item.id,
              item.label,
              item.icon,
              activeNav === item.id && !(showQuick && item.id === 'home' && !!activeQuick),
              () => onNavChange(item.id),
            )}
            {showQuick && item.id === 'home' && (
              <div
                onMouseEnter={() => setCatOpen(true)}
                onMouseLeave={() => setCatOpen(false)}
                onFocusCapture={() => setCatOpen(true)}
                onBlurCapture={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setCatOpen(false);
                }}
                className="flex flex-col"
              >
                {/* TV stays visible and opens its dropdown on hover, but clicking it does nothing. */}
                {renderItem('tv', 'TV', Tv, false, () => setCatOpen(true))}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                    catOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="flex flex-col gap-1 overflow-hidden pt-1" role="menu" aria-label="TV categories">
                    {QUICK_CATEGORIES.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        data-tv-focusable="true"
                        tabIndex={catOpen ? 0 : -1}
                        onClick={() => {
                          setCatOpen(false);
                          onPickCategory!(id);
                        }}
                        aria-label={label}
                        title={expanded ? undefined : label}
                        className={`tv-focusable flex h-10 items-center gap-3 rounded-full text-sm font-medium text-white hover:bg-white/[0.08] hover:text-white ${
                          activeQuick === id ? 'bg-white/10' : ''
                        } ${expanded ? 'pl-8 pr-3' : 'justify-center px-0'}`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-white" />
                        {expanded && <span className="whitespace-nowrap">{label}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="relative mx-2.5 mt-4 pt-3">
        <div className="flex flex-col gap-2">
          {renderItem('categories', 'Categories', LayoutGrid, !bigScreen && categoriesActive, bigScreen ? () => {} : onOpenCategories)}
        </div>
      </div>
      {profileItem && (
        <div className="mx-2.5 mt-auto flex flex-col pt-3">
          {renderItem(profileItem.id, profileItem.label, profileItem.icon, activeNav === profileItem.id, () =>
            onNavChange(profileItem.id),
          )}
        </div>
      )}
    </aside>
  );
}
