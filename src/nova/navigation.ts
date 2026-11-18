import { Home, Search, Clapperboard, CalendarClock, User } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: typeof Home;
};

export const navItems: NavItem[] = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'clips', label: 'Clime', icon: Clapperboard },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'coming-soon', label: 'Coming Soon', icon: CalendarClock },
  { id: 'profile', label: 'Profile', icon: User },
];

/** Sections that only the phone app offers; TV and desktop apps leave them out. */
export const PHONE_ONLY_NAV_IDS = ['clips', 'coming-soon'];

export function navItemsFor(bigScreen: boolean): NavItem[] {
  return bigScreen ? navItems.filter((item) => !PHONE_ONLY_NAV_IDS.includes(item.id)) : navItems;
}
