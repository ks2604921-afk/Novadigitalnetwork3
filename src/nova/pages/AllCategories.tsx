import { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { categoryNames } from '@/nova/pages/CategoryPage';
import PosterImage from '@/nova/components/PosterImage';
import barcode from '@/assets/barcode-poster.webp';
import crimson from '@/assets/crimson-veil-poster.webp';
import neon from '@/assets/neon-dreams-poster.webp';
import shadow from '@/assets/shadow-protocol-poster.webp';

type AllCategoriesProps = {
  onBack: () => void;
  onPick: (cat: string) => void;
};

type Tile = { label: string; sub?: string; target?: string };
type Section = { title: string; style: 'art' | 'logo'; tint: string[]; tiles: Tile[] };

const posters = [crimson, shadow, neon, barcode];

const sections: Section[] = [
  {
    title: 'Browse',
    style: 'art',
    tint: ['from-teal-700/70', 'from-fuchsia-800/70', 'from-indigo-700/70'],
    tiles: [
      { label: 'TV', target: 'TV' },
      { label: 'Movies', target: 'Movies' },
      { label: 'Sports', target: 'Sports' },
      { label: 'Series', target: 'Series' },
      { label: 'News' },
      { label: 'New & Hot' },
    ],
  },
  {
    title: 'Studios',
    style: 'logo',
    tint: [],
    tiles: [
      { label: 'NOVA Specials' },
      { label: 'Nova Originals' },
      { label: 'Cinema Max' },
      { label: 'Indie Films' },
      { label: 'Global Hits' },
    ],
  },
  {
    title: 'Popular Languages',
    style: 'art',
    tint: ['from-indigo-700/80', 'from-orange-800/80', 'from-amber-800/80', 'from-rose-800/80', 'from-teal-700/80'],
    tiles: [
      { label: 'हिन्दी', sub: 'Hindi' },
      { label: 'English' },
      { label: 'தமிழ்', sub: 'Tamil' },
      { label: 'తెలుగు', sub: 'Telugu' },
      { label: 'मराठी', sub: 'Marathi' },
      { label: 'বাংলা', sub: 'Bengali' },
      { label: '한국어', sub: 'Korean' },
      { label: '日本', sub: 'Japanese' },
    ],
  },
  {
    title: 'Popular Channels',
    style: 'logo',
    tint: [],
    tiles: [
      { label: 'NOVA Plus' },
      { label: 'Colors' },
      { label: 'Star Gold' },
      { label: 'Music One' },
      { label: 'Select Picks' },
    ],
  },
  {
    title: 'Popular Genres',
    style: 'art',
    tint: ['from-rose-500/80', 'from-teal-600/80', 'from-yellow-700/80', 'from-sky-700/80', 'from-violet-700/80'],
    tiles: [
      { label: 'Romance' },
      { label: 'Drama' },
      { label: 'Family' },
      { label: 'Comedy', target: 'Comedy' },
      { label: 'Kids', target: 'Kids' },
      { label: 'Thriller' },
      { label: 'Horror' },
      { label: 'Action' },
      { label: 'Sci-Fi' },
      { label: 'Mystery' },
      { label: 'Anime' },
      { label: 'Documentary' },
    ],
  },
  {
    title: 'Popular Sports',
    style: 'art',
    tint: ['from-yellow-700/80', 'from-teal-600/80', 'from-indigo-500/80', 'from-emerald-700/80', 'from-purple-700/80'],
    tiles: [
      { label: 'Cricket', target: 'Sports' },
      { label: 'Football', target: 'Sports' },
      { label: 'Hockey', target: 'Sports' },
      { label: 'Motorsports', target: 'Sports' },
      { label: 'Esports', target: 'Sports' },
    ],
  },
];

const resolve = (tile: Tile) => {
  const want = tile.target ?? tile.label;
  if (categoryNames.includes(want)) return want;
  return categoryNames.includes("Movies") ? "Movies" : (categoryNames[0] ?? want);
};

export default function AllCategories({ onBack, onPick }: AllCategoriesProps) {
  // The sheet slides up from the bottom edge on open.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keep the page behind still while the sheet is open, and let Escape close it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onBack]);

  return (
    <div
      role="dialog"
      aria-label="Browse Categories"
      aria-modal="true"
      className={`nova-sheet fixed inset-0 z-40 overflow-y-auto bg-nova-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        mounted ? 'nova-sheet-open' : 'nova-sheet-closed'
      }`}
    >
      <div className="sticky top-0 z-10 bg-[#0f1219]/[0.92]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-3 pt-4 sm:px-6 md:pl-[104px] lg:px-12">
          <h1 className="text-xl font-bold text-nova-text sm:text-2xl">Browse Categories</h1>
          <button
            type="button"
            data-tv-focusable="true"
            onClick={onBack}
            aria-label="Close categories"
            className="tv-focusable flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-nova-text ring-1 ring-white/10 transition-colors hover:bg-white/15"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-40 md:pl-[104px]">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="mb-2 flex items-center justify-between px-4 sm:px-6 lg:px-12">
              <h2 className="text-base font-semibold text-nova-text sm:text-lg">{section.title}</h2>
              {section.tiles.length > 3 && <ChevronRight className="h-4 w-4 text-nova-muted" />}
            </div>
            <div data-tv-row="true" className="tv-scroll-row flex gap-2 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {section.tiles.map((tile, i) => (
                <button
                  type="button"
                  key={tile.label}
                  data-tv-focusable="true"
                  onClick={() => onPick(resolve(tile))}
                  className="tv-focusable group relative h-[60px] w-[31%] min-w-[100px] max-w-[180px] shrink-0 overflow-hidden rounded-md border border-transparent bg-nova-card text-left ring-1 ring-white/5 hover:scale-[1.03] sm:h-20"
                >
                  {section.style === 'art' ? (
                    <>
                      <PosterImage
                        src={posters[i % posters.length] ?? crimson}
                        alt=""
                        width={240}
                        className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-80"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${section.tint[i % section.tint.length]} via-nova-card/40 to-transparent`}
                      />
                      <div className="absolute bottom-1.5 left-2">
                        <p className="text-xs font-semibold leading-tight text-nova-text sm:text-sm">{tile.label}</p>
                        {tile.sub && <p className="text-[9px] text-nova-text/70">{tile.sub}</p>}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center px-2">
                      <p className="text-center text-sm font-black uppercase leading-tight tracking-tight text-nova-text">
                        {tile.label}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
