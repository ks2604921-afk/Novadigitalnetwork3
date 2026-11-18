import { ArrowLeft, Play } from 'lucide-react';
import { VirtualizedRowList } from '@/nova/components/VirtualizedRowList';

type CategoryPageProps = {
  category: string;
  onBack: () => void;
};

export const contentByCategory: Record<string, { title: string; items: { title: string; meta?: string; gradient: string }[] }[]> = {
  TV: [
    {
      title: 'Popular TV Shows',
      items: [
        { title: 'Taarak Mehta', meta: 'Daily', gradient: 'from-yellow-800 to-nova-card' },
        { title: 'CID', meta: 'Weekend', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Crime Patrol', meta: 'Daily', gradient: 'from-red-800 to-nova-card' },
        { title: 'Kumkum Bhagya', meta: 'Mon-Sat', gradient: 'from-pink-800 to-nova-card' },
        { title: 'Kundali', meta: 'Daily', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Bade Achhe', meta: 'Weekend', gradient: 'from-green-800 to-nova-card' },
      ],
    },
    {
      title: 'Live TV Channels',
      items: [
        { title: 'Colors TV', meta: 'Live', gradient: 'from-red-800 to-nova-card' },
        { title: 'Star Plus', meta: 'Live', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Sony TV', meta: 'Live', gradient: 'from-green-800 to-nova-card' },
        { title: 'Zee TV', meta: 'Live', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Sab TV', meta: 'Live', gradient: 'from-purple-800 to-nova-card' },
        { title: 'And TV', meta: 'Live', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
    {
      title: 'TV Drama',
      items: [
        { title: 'Anupamaa', meta: 'Mon-Sat', gradient: 'from-pink-800 to-nova-card' },
        { title: 'Yeh Rishta', meta: 'Daily', gradient: 'from-rose-800 to-nova-card' },
        { title: 'Ghum Hai', meta: 'Mon-Sat', gradient: 'from-red-800 to-nova-card' },
        { title: 'Imlie', meta: 'Daily', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Pandya Store', meta: 'Mon-Sat', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Bhagya', meta: 'Daily', gradient: 'from-purple-800 to-nova-card' },
      ],
    },
    {
      title: 'Reality Shows',
      items: [
        { title: 'Bigg Boss 18', meta: 'Live Now', gradient: 'from-red-800 to-nova-card' },
        { title: 'KBC 16', meta: 'Weekdays', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Roadies', meta: 'Season 20', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Indian Idol', meta: 'Weekend', gradient: 'from-purple-800 to-nova-card' },
        { title: 'Dance India', meta: 'New Season', gradient: 'from-green-800 to-nova-card' },
        { title: 'Splitsvilla', meta: 'Season 15', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
  ],
  Series: [
    {
      title: 'NOVA Originals',
      items: [
        { title: 'Echoes of Tomorrow', meta: 'New Series', gradient: 'from-red-800 to-nova-card' },
        { title: 'Black Mirror City', meta: 'Season 2', gradient: 'from-orange-800 to-nova-card' },
        { title: 'The Order', meta: 'Exclusive', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Rogue State', meta: 'Limited Series', gradient: 'from-purple-800 to-nova-card' },
        { title: 'Midnight Run', meta: 'Now Streaming', gradient: 'from-green-800 to-nova-card' },
        { title: 'Zero Hour', meta: 'Premiere', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
    {
      title: 'Popular Series',
      items: [
        { title: 'Sacred Games', meta: 'Season 3', gradient: 'from-red-800 to-nova-card' },
        { title: 'Mirzapur', meta: 'Season 4', gradient: 'from-orange-800 to-nova-card' },
        { title: 'The Family Man', meta: 'Season 3', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Panchayat', meta: 'Season 3', gradient: 'from-green-800 to-nova-card' },
        { title: 'Scam 1992', meta: 'Complete', gradient: 'from-purple-800 to-nova-card' },
        { title: 'Aspirants', meta: 'Season 2', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
    {
      title: 'Top Entertainment Drama',
      items: [
        { title: 'Maharani', meta: 'Season 3', gradient: 'from-red-800 to-nova-card' },
        { title: 'Aashram', meta: 'Season 4', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Rana Naidu', meta: 'Season 2', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Betaal', meta: 'Complete', gradient: 'from-green-800 to-nova-card' },
        { title: 'Beta', meta: 'New', gradient: 'from-purple-800 to-nova-card' },
        { title: 'Criminal Justice', meta: 'Season 4', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
    {
      title: 'Comedy Series',
      items: [
        { title: 'TMKOC', meta: 'Daily', gradient: 'from-yellow-800 to-nova-card' },
        { title: 'Bhabi Ji Ghar', meta: 'Daily', gradient: 'from-orange-800 to-nova-card' },
        { title: 'The Kapil Show', meta: 'Weekend', gradient: 'from-red-800 to-nova-card' },
        { title: 'Wagle Ki Duniya', meta: 'Daily', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Happu Ki Ultan', meta: 'Daily', gradient: 'from-green-800 to-nova-card' },
        { title: 'F.I.R', meta: 'Complete', gradient: 'from-purple-800 to-nova-card' },
      ],
    },
  ],
  Sports: [
    {
      title: 'Live Now',
      items: [
        { title: 'IPL 2026 Finals', meta: 'Live · Cricket', gradient: 'from-blue-900 to-nova-card' },
        { title: 'World Cup Qualifier', meta: 'Live · Football', gradient: 'from-green-900 to-nova-card' },
        { title: 'WWE Raw', meta: 'Live · Wrestling', gradient: 'from-red-900 to-nova-card' },
        { title: 'F1 Grand Prix', meta: 'Live · Racing', gradient: 'from-orange-900 to-nova-card' },
      ],
    },
    {
      title: 'Cricket',
      items: [
        { title: 'India vs Australia', meta: 'T20', gradient: 'from-blue-800 to-nova-card' },
        { title: 'IPL Highlights', meta: '2026', gradient: 'from-orange-800 to-nova-card' },
        { title: 'World Cup Best Moments', meta: '2026', gradient: 'from-green-800 to-nova-card' },
        { title: 'BGT Series', meta: 'Test', gradient: 'from-red-800 to-nova-card' },
        { title: 'Asia Cup', meta: 'ODI', gradient: 'from-purple-800 to-nova-card' },
        { title: 'PSL Final', meta: 'T20', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
    {
      title: 'Football',
      items: [
        { title: 'ISL Final', meta: '2026', gradient: 'from-red-800 to-nova-card' },
        { title: 'Premier League', meta: 'Weekend', gradient: 'from-blue-800 to-nova-card' },
        { title: 'La Liga', meta: 'Weekly', gradient: 'from-green-800 to-nova-card' },
        { title: 'Champions League', meta: 'Midweek', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Serie A', meta: 'Weekly', gradient: 'from-purple-800 to-nova-card' },
        { title: 'Bundesliga', meta: 'Weekend', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
    {
      title: 'Other Sports',
      items: [
        { title: 'WWE WrestleMania', meta: 'Special', gradient: 'from-red-800 to-nova-card' },
        { title: 'F1 Monaco GP', meta: 'Racing', gradient: 'from-orange-800 to-nova-card' },
        { title: 'NBA Finals', meta: 'Basketball', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Olympics 2026', meta: 'Multi-Sport', gradient: 'from-green-800 to-nova-card' },
        { title: 'Pro Kabaddi', meta: 'Live', gradient: 'from-purple-800 to-nova-card' },
        { title: 'World Boxing', meta: 'Title Fight', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
  ],
  Movies: [
    {
      title: 'Trending Now',
      items: [
        { title: 'Neon Dreams', meta: 'Sci-Fi · 2026', gradient: 'from-purple-900 to-nova-card' },
        { title: 'Midnight Run', meta: 'Thriller · 2026', gradient: 'from-red-900 to-nova-card' },
        { title: 'The Last Signal', meta: 'Drama · 2025', gradient: 'from-blue-900 to-nova-card' },
        { title: 'City of Echoes', meta: 'Mystery · 2025', gradient: 'from-cyan-900 to-nova-card' },
        { title: 'Steel Horizon', meta: 'Action · 2026', gradient: 'from-orange-900 to-nova-card' },
        { title: 'Silent Storm', meta: 'War · 2025', gradient: 'from-green-900 to-nova-card' },
      ],
    },
    {
      title: 'Blockbusters',
      items: [
        { title: 'Galaxy Wars', meta: 'Sci-Fi', gradient: 'from-indigo-900 to-nova-card' },
        { title: 'Rogue Protocol', meta: 'Action', gradient: 'from-red-800 to-nova-card' },
        { title: 'The Vault', meta: 'Heist', gradient: 'from-yellow-900 to-nova-card' },
        { title: 'Deep Water', meta: 'Thriller', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Sunfire', meta: 'Adventure', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Night Circuit', meta: 'Crime', gradient: 'from-purple-800 to-nova-card' },
      ],
    },
  ],
  Kids: [
    {
      title: 'Popular Cartoons',
      items: [
        { title: 'Chhota Bheem', meta: 'Adventure', gradient: 'from-yellow-800 to-nova-card' },
        { title: 'Motu Patlu', meta: 'Comedy', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Doraemon', meta: 'Daily', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Shinchan', meta: 'Comedy', gradient: 'from-red-800 to-nova-card' },
        { title: 'Ben 10', meta: 'Action', gradient: 'from-green-800 to-nova-card' },
        { title: 'Pokemon', meta: 'Adventure', gradient: 'from-cyan-800 to-nova-card' },
      ],
    },
    {
      title: 'Kids Movies',
      items: [
        { title: 'Little Explorers', meta: 'Animated', gradient: 'from-teal-800 to-nova-card' },
        { title: 'The Magic Forest', meta: 'Fantasy', gradient: 'from-green-800 to-nova-card' },
        { title: 'Robot Friends', meta: 'Sci-Fi', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Panda Patrol', meta: 'Comedy', gradient: 'from-lime-800 to-nova-card' },
        { title: 'Sky Pirates', meta: 'Adventure', gradient: 'from-purple-800 to-nova-card' },
        { title: 'Unicorn Tales', meta: 'Fantasy', gradient: 'from-pink-800 to-nova-card' },
      ],
    },
  ],
  Comedy: [
    {
      title: 'Comedy Shows',
      items: [
        { title: 'The Laugh Club', meta: 'Weekly', gradient: 'from-yellow-800 to-nova-card' },
        { title: 'Office Hours', meta: 'Sitcom', gradient: 'from-blue-800 to-nova-card' },
        { title: 'Family Freestyle', meta: 'Sitcom', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Prank Nation', meta: 'Reality', gradient: 'from-red-800 to-nova-card' },
        { title: 'Roomies', meta: 'New Series', gradient: 'from-purple-800 to-nova-card' },
        { title: 'Bakery Battles', meta: 'Comedy', gradient: 'from-pink-800 to-nova-card' },
      ],
    },
    {
      title: 'Stand-up Specials',
      items: [
        { title: 'Midnight Mic', meta: 'Special', gradient: 'from-purple-900 to-nova-card' },
        { title: 'Chai & Chuckles', meta: 'Hindi', gradient: 'from-orange-800 to-nova-card' },
        { title: 'Open Mic Nights', meta: 'Live', gradient: 'from-cyan-800 to-nova-card' },
        { title: 'Roast Republic', meta: 'Special', gradient: 'from-red-900 to-nova-card' },
        { title: 'Punchline', meta: 'New', gradient: 'from-yellow-800 to-nova-card' },
        { title: 'Late Night Laughs', meta: 'Weekly', gradient: 'from-blue-800 to-nova-card' },
      ],
    },
  ],
};

export const categoryNames = Object.keys(contentByCategory);

export default function CategoryPage({ category, onBack }: CategoryPageProps) {
  const sections = contentByCategory[category] ?? [];

  return (
    <div className="min-h-screen bg-[#0d0e15] pt-20 pb-24">
      <div className="px-6 lg:px-12" data-tv-row="true">
        <button
          type="button"
          data-tv-focusable="true"
          onClick={onBack}
          className="tv-focusable mb-6 flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
          Back to Home
        </button>
        <h1 className="mb-8 text-4xl font-black text-white">{category}</h1>
      </div>
      <VirtualizedRowList
        items={sections}
        getKey={(section) => section.title}
        estimateRowHeight={280}
        overscan={2}
        initialMountedCount={4}
        renderRow={(section) => (
          <section className="mt-6 px-6 lg:px-12">
            <h2 className="mb-4 text-xl font-bold text-white">{section.title}</h2>
            <div data-tv-row="true" className="tv-scroll-row flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {section.items.map((item) => (
                <button
                  type="button"
                  key={item.title}
                  data-tv-focusable="true"
                  aria-label={`Play ${item.title}`}
                  className={`tv-focusable group relative h-56 w-40 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-transparent bg-gradient-to-br text-left ${item.gradient} hover:scale-105 hover:border-white/60 lg:h-64 lg:w-44`}
                >
                  <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
                  <Play className="absolute left-3 top-3 h-5 w-5 fill-white text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </section>
        )}
      />
    </div>
  );
}
