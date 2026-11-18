import {
  Cast,
  Play,
  Plus,
  Star,
  TrendingUp,
  Sparkles,
  Clapperboard,
  Trophy,
  Film,
  Tv,
  Users,
  Laugh,
  Radio,
  Award,
  Baby,
  Flame,
  Heart,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ResumePlayer from '@/nova/components/ResumePlayer';
import BannerWatchlist from '@/nova/components/BannerWatchlist';
import PosterImage from '@/nova/components/PosterImage';
import { getRemainingMinutesLabel } from '@/nova/related-catalog';
import { VirtualizedCardStrip, VirtualizedRowList } from '@/nova/components/VirtualizedRowList';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

type Slide = {
  title: string;
  subtitle: string;
  contentType?: 'movie' | 'series' | 'video';
  year: string;
  languages: string;
  genre: string;
  rating: string;
  artwork: string;
  accent: string;
  glow: string;
};

const defaultSlides: Slide[] = [
  {
    title: 'Saruam Maya',
    subtitle: 'Movie · Dazzler',
    contentType: 'movie',
    year: '2025',
    languages: '7 Languages',
    genre: 'Comedy',
    rating: '8.0',
    artwork:
      'https://images.pexels.com/photos/8451629/pexels-photo-8451629.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#f5a900]/70 via-[#d87900]/20 to-[#050509]',
    glow: 'rgba(238,153,0,0.13)',
  },
  {
    title: 'Neon Dreams',
    subtitle: 'Series · Premiere',
    contentType: 'series',
    year: '2025',
    languages: '5 Languages',
    genre: 'Sci-Fi',
    rating: '8.4',
    artwork:
      'https://images.pexels.com/photos/35219288/pexels-photo-35219288.png?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#1e3a8a]/70 via-[#1e1b4b]/20 to-[#050509]',
    glow: 'rgba(59,130,246,0.13)',
  },
  {
    title: 'Crimson Veil',
    subtitle: 'Exclusive',
    year: '2024',
    languages: '4 Languages',
    genre: 'Thriller',
    rating: '7.9',
    artwork:
      'https://images.pexels.com/photos/28792993/pexels-photo-28792993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#991b1b]/70 via-[#7f1d1d]/20 to-[#050509]',
    glow: 'rgba(239,68,68,0.13)',
  },
  {
    title: 'Shadow Protocol',
    subtitle: 'Now Streaming',
    year: '2025',
    languages: '6 Languages',
    genre: 'Action',
    rating: '8.2',
    artwork:
      'https://images.pexels.com/photos/6265198/pexels-photo-6265198.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#1e293b]/70 via-[#0f172a]/20 to-[#050509]',
    glow: 'rgba(100,116,139,0.13)',
  },
  {
    title: 'Barcode',
    subtitle: 'Original',
    year: '2024',
    languages: '3 Languages',
    genre: 'Mystery',
    rating: '7.6',
    artwork:
      'https://images.pexels.com/photos/228838/pexels-photo-228838.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#065f46]/70 via-[#064e3b]/20 to-[#050509]',
    glow: 'rgba(16,185,129,0.13)',
  },
  {
    title: 'Spectra',
    subtitle: 'Featured',
    year: '2025',
    languages: '8 Languages',
    genre: 'Drama',
    rating: '8.1',
    artwork:
      'https://images.pexels.com/photos/34014938/pexels-photo-34014938.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#7c2d12]/70 via-[#9a3412]/20 to-[#050509]',
    glow: 'rgba(251,146,60,0.13)',
  },
  {
    title: 'The Silent Witness',
    subtitle: 'New Release',
    year: '2025',
    languages: '5 Languages',
    genre: 'Crime',
    rating: '7.8',
    artwork:
      'https://images.pexels.com/photos/749091/pexels-photo-749091.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#312e81]/70 via-[#1e1b4b]/20 to-[#050509]',
    glow: 'rgba(129,140,248,0.13)',
  },
  {
    title: 'Midnight Hollow',
    subtitle: 'Special',
    year: '2024',
    languages: '4 Languages',
    genre: 'Horror',
    rating: '7.4',
    artwork:
      'https://images.pexels.com/photos/34626543/pexels-photo-34626543.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#1c1917]/70 via-[#292524]/20 to-[#050509]',
    glow: 'rgba(168,162,158,0.13)',
  },
  {
    title: 'Foggy Crossing',
    subtitle: 'Critics Pick',
    year: '2025',
    languages: '6 Languages',
    genre: 'Suspense',
    rating: '8.3',
    artwork:
      'https://images.pexels.com/photos/38917173/pexels-photo-38917173.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#0c4a6e]/70 via-[#082f49]/20 to-[#050509]',
    glow: 'rgba(56,189,248,0.13)',
  },
  {
    title: 'Last Light',
    subtitle: 'Award Winner',
    year: '2024',
    languages: '7 Languages',
    genre: 'Romance',
    rating: '8.5',
    artwork:
      'https://images.pexels.com/photos/39619133/pexels-photo-39619133.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    accent: 'from-[#831843]/70 via-[#500724]/20 to-[#050509]',
    glow: 'rgba(244,114,182,0.13)',
  },
];

type ContentSection = {
  title: string;
  icon: LucideIcon;
  items: {
    title: string;
    meta?: string;
    contentType?: 'movie' | 'series' | 'video';
    season?: number;
    episode?: number;
    date?: string;
    remainingMinutes?: number;
    totalMinutes?: number;
    gradient: string;
  }[];
  variant?: 'wide' | 'poster' | 'ranked';
};

const sections: ContentSection[] = [
  {
    title: 'Continue Watching for Pranaay',
    icon: Play,
    variant: 'wide',
    items: [
      { title: 'Demon Slayer', meta: 'Serial · S1:E5 · 21m left', contentType: 'series', season: 1, episode: 5, date: '21 Nov', remainingMinutes: 21, totalMinutes: 42, gradient: 'from-red-900 to-nova-card' },
      { title: 'Shadow Protocol', meta: 'Movie · 1h 26m left', contentType: 'movie', remainingMinutes: 86, totalMinutes: 132, gradient: 'from-slate-800 to-nova-card' },
      { title: 'Cars on Fire', meta: 'Serial · S2:E3 · 14m left', contentType: 'series', season: 2, episode: 3, date: '18 Nov', remainingMinutes: 14, totalMinutes: 38, gradient: 'from-orange-900 to-nova-card' },
      { title: 'Crimson Veil', meta: 'Movie · 1h 14m left', contentType: 'movie', remainingMinutes: 74, totalMinutes: 120, gradient: 'from-rose-900 to-nova-card' },
    ],
  },
  {
    title: 'NOVA Originals',
    icon: Clapperboard,
    variant: 'poster',
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
    title: 'Top 10 in India',
    icon: TrendingUp,
    variant: 'ranked',
    items: [
      { title: 'Saruam Maya', gradient: 'from-amber-700 to-nova-card' },
      { title: 'Neon Dreams', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Crimson Veil', gradient: 'from-red-800 to-nova-card' },
      { title: 'Shadow Protocol', gradient: 'from-slate-700 to-nova-card' },
      { title: 'Barcode', gradient: 'from-emerald-800 to-nova-card' },
      { title: 'Spectra', gradient: 'from-orange-800 to-nova-card' },
      { title: 'The Silent Witness', gradient: 'from-indigo-800 to-nova-card' },
      { title: 'Midnight Hollow', gradient: 'from-stone-700 to-nova-card' },
      { title: 'Foggy Crossing', gradient: 'from-sky-800 to-nova-card' },
      { title: 'Last Light', gradient: 'from-pink-800 to-nova-card' },
    ],
  },
  {
    title: "What's New",
    icon: Sparkles,
    variant: 'poster',
    items: [
      { title: 'Aftermath', meta: 'New Episode', gradient: 'from-red-900 to-nova-card' },
      { title: 'Broken Crown', meta: 'Just Added', gradient: 'from-orange-900 to-nova-card' },
      { title: 'The Last Kingdom', meta: 'New Season', gradient: 'from-blue-900 to-nova-card' },
      { title: 'Velvet', meta: 'Premiere', gradient: 'from-purple-900 to-nova-card' },
      { title: 'Iron Fist', meta: 'New', gradient: 'from-green-900 to-nova-card' },
      { title: 'Skyfall', meta: 'Just Added', gradient: 'from-cyan-900 to-nova-card' },
    ],
  },
  {
    title: 'Sport Boss',
    icon: Trophy,
    variant: 'wide',
    items: [
      { title: 'IPL 2025 Finals', meta: 'Live · Cricket', gradient: 'from-blue-900 to-nova-card' },
      { title: 'World Cup Highlights', meta: 'Football', gradient: 'from-green-900 to-nova-card' },
      { title: 'WWE Raw', meta: 'Wrestling', gradient: 'from-red-900 to-nova-card' },
      { title: 'F1 Grand Prix', meta: 'Racing', gradient: 'from-orange-900 to-nova-card' },
    ],
  },
  {
    title: 'South Action on NOVA',
    icon: Zap,
    variant: 'poster',
    items: [
      { title: 'KGF Chapter 3', meta: '2025', gradient: 'from-red-800 to-nova-card' },
      { title: 'Pushpa 2', meta: '2025', gradient: 'from-orange-800 to-nova-card' },
      { title: 'Salaar 2', meta: '2025', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Jailer 2', meta: '2025', gradient: 'from-purple-800 to-nova-card' },
      { title: 'Vikram 2', meta: '2024', gradient: 'from-green-800 to-nova-card' },
      { title: 'Leo 2', meta: '2025', gradient: 'from-cyan-800 to-nova-card' },
    ],
  },
  {
    title: 'Top New Movies For You',
    icon: Flame,
    variant: 'poster',
    items: [
      { title: 'Stree 2', meta: 'Just Added', gradient: 'from-red-900 to-nova-card' },
      { title: 'Bhediya 2', meta: 'New', gradient: 'from-orange-900 to-nova-card' },
      { title: 'Munjya 2', meta: 'Premiere', gradient: 'from-blue-900 to-nova-card' },
      { title: 'Crew 2', meta: 'New', gradient: 'from-purple-900 to-nova-card' },
      { title: 'Do Patti', meta: 'Just Added', gradient: 'from-green-900 to-nova-card' },
      { title: 'Ul Jalool Ishq', meta: 'New', gradient: 'from-cyan-900 to-nova-card' },
    ],
  },
  {
    title: 'Top Bollywood Movies',
    icon: Film,
    variant: 'poster',
    items: [
      { title: 'Pathaan', meta: '2025', gradient: 'from-red-800 to-nova-card' },
      { title: 'Jawan', meta: '2025', gradient: 'from-orange-800 to-nova-card' },
      { title: 'Animal', meta: '2024', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Dunki', meta: '2024', gradient: 'from-purple-800 to-nova-card' },
      { title: 'Tiger 3', meta: '2025', gradient: 'from-green-800 to-nova-card' },
      { title: 'Fighter', meta: '2025', gradient: 'from-cyan-800 to-nova-card' },
    ],
  },
  {
    title: 'Kids Shows',
    icon: Baby,
    variant: 'poster',
    items: [
      { title: 'Chhota Bheem', meta: 'Season 5', gradient: 'from-yellow-800 to-nova-card' },
      { title: 'Motu Patlu', meta: 'New Episodes', gradient: 'from-orange-800 to-nova-card' },
      { title: 'Doraemon', meta: 'Daily', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Shinchan', meta: 'Weekend', gradient: 'from-green-800 to-nova-card' },
      { title: 'Perman', meta: 'Season 2', gradient: 'from-purple-800 to-nova-card' },
      { title: 'Ninja Hattori', meta: 'Daily', gradient: 'from-cyan-800 to-nova-card' },
    ],
  },
  {
    title: 'Popular in Kids Shows',
    icon: Baby,
    variant: 'poster',
    items: [
      { title: 'Powerpuff Girls', meta: 'Popular', gradient: 'from-pink-800 to-nova-card' },
      { title: 'Ben 10', meta: 'Trending', gradient: 'from-green-800 to-nova-card' },
      { title: 'Mr. Bean', meta: 'Popular', gradient: 'from-orange-800 to-nova-card' },
      { title: 'Tom & Jerry', meta: 'Classic', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Oggy', meta: 'Trending', gradient: 'from-red-800 to-nova-card' },
      { title: 'Kiteretsu', meta: 'Popular', gradient: 'from-purple-800 to-nova-card' },
    ],
  },
  {
    title: 'Popular in TV Shows',
    icon: Tv,
    variant: 'poster',
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
    title: 'NOVA Special',
    icon: Heart,
    variant: 'poster',
    items: [
      { title: 'NOVA Diwali Special', meta: 'Festival', gradient: 'from-amber-800 to-nova-card' },
      { title: 'NOVA Holi Concert', meta: 'Live', gradient: 'from-pink-800 to-nova-card' },
      { title: 'NOVA Awards Night', meta: 'Exclusive', gradient: 'from-red-800 to-nova-card' },
      { title: 'NOVA Comedy Fest', meta: 'Special', gradient: 'from-orange-800 to-nova-card' },
      { title: 'NOVA Music Night', meta: 'Live', gradient: 'from-purple-800 to-nova-card' },
      { title: 'NOVA Premiere', meta: 'Exclusive', gradient: 'from-cyan-800 to-nova-card' },
    ],
  },
  {
    title: 'Series on NOVA',
    icon: Tv,
    variant: 'poster',
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
    title: 'TV Drama',
    icon: Tv,
    variant: 'poster',
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
    title: 'Reality Popular in India',
    icon: Users,
    variant: 'poster',
    items: [
      { title: 'Bigg Boss 18', meta: 'Live Now', gradient: 'from-red-800 to-nova-card' },
      { title: 'KBC 16', meta: 'Weekdays', gradient: 'from-orange-800 to-nova-card' },
      { title: 'Roadies', meta: 'Season 20', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Indian Idol', meta: 'Weekend', gradient: 'from-purple-800 to-nova-card' },
      { title: 'Dance India', meta: 'New Season', gradient: 'from-green-800 to-nova-card' },
      { title: 'Splitsvilla', meta: 'Season 15', gradient: 'from-cyan-800 to-nova-card' },
    ],
  },
  {
    title: 'Comedy Boss',
    icon: Laugh,
    variant: 'wide',
    items: [
      { title: 'The Great Indian Laughter', meta: 'Stand-up · 45m', gradient: 'from-orange-900 to-nova-card' },
      { title: 'Comedy Nights', meta: 'Show · 1h', gradient: 'from-red-900 to-nova-card' },
      { title: 'Kapil Sharma', meta: 'Weekend · 1h', gradient: 'from-blue-900 to-nova-card' },
      { title: 'Munawar Live', meta: 'Special · 1h 20m', gradient: 'from-green-900 to-nova-card' },
    ],
  },
  {
    title: 'Top Comedy Shows in India',
    icon: Laugh,
    variant: 'poster',
    items: [
      { title: 'TMKOC', meta: 'Daily', gradient: 'from-yellow-800 to-nova-card' },
      { title: 'Bhabi Ji Ghar', meta: 'Daily', gradient: 'from-orange-800 to-nova-card' },
      { title: 'The Kapil Show', meta: 'Weekend', gradient: 'from-red-800 to-nova-card' },
      { title: 'Wagle Ki Duniya', meta: 'Daily', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Happu Ki Ultan', meta: 'Daily', gradient: 'from-green-800 to-nova-card' },
      { title: 'F.I.R', meta: 'Complete', gradient: 'from-purple-800 to-nova-card' },
    ],
  },
  {
    title: 'Top Entertainment Channel',
    icon: Radio,
    variant: 'poster',
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
    title: 'Top Entertainment Drama on NOVA',
    icon: Award,
    variant: 'poster',
    items: [
      { title: 'Maharani', meta: 'Season 3', gradient: 'from-red-800 to-nova-card' },
      { title: 'Aashram', meta: 'Season 4', gradient: 'from-orange-800 to-nova-card' },
      { title: 'Rana Naidu', meta: 'Season 2', gradient: 'from-blue-800 to-nova-card' },
      { title: 'Betaal', meta: 'Complete', gradient: 'from-green-800 to-nova-card' },
      { title: 'Beta', meta: 'New', gradient: 'from-purple-800 to-nova-card' },
      { title: 'Criminal Justice', meta: 'Season 4', gradient: 'from-cyan-800 to-nova-card' },
    ],
  },
];

function SectionRow({
  section,
  onPlay,
}: {
  section: ContentSection;
  onPlay: (title: string, contentType?: 'movie' | 'series' | 'video') => void;
}) {
  const Icon = section.icon;

  if (section.variant === 'wide') {
    const isContinueWatching = section.title.startsWith('Continue Watching');
    return (
      <section className="mt-8 px-6 lg:px-12">
        <div className="mb-4 flex items-center gap-2">
          <Icon className="h-5 w-5 text-white" />
          <h2 className="text-xl font-bold text-white">{section.title}</h2>
        </div>
        <VirtualizedCardStrip
          items={section.items}
          getKey={(item) => item.title}
          itemWidthPx={320}
          renderCard={(item) => {
            const showSerialMeta =
              isContinueWatching &&
              item.contentType === 'series' &&
              item.season != null &&
              item.episode != null;
            const showMovieMeta = isContinueWatching && item.contentType === 'movie';
            return (
              <div key={item.title} className="w-72 flex-shrink-0 lg:w-80">
                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => onPlay(item.title, item.contentType)}
                  aria-label={`Resume ${item.title}`}
                  className={`tv-focusable group relative block h-40 w-full cursor-pointer overflow-hidden rounded-xl border border-transparent bg-gradient-to-br text-left ${item.gradient} hover:scale-105 hover:border-white/60 lg:h-44`}
                >
                  <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
                  <Play className="absolute left-3 top-3 h-6 w-6 fill-white text-white" />
                </button>
                {showSerialMeta && (
                  <div data-testid="continue-serial-meta" className="mt-2 px-0.5">
                    <p className="text-xs font-semibold text-white">
                      {`S${item.season} E${item.episode} · ${item.date ?? '21 Nov'}`}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium tabular-nums text-white/75">
                      {getRemainingMinutesLabel(item.title, item.totalMinutes ?? 42, item.remainingMinutes)}
                    </p>
                  </div>
                )}
                {showMovieMeta && (
                  <div data-testid="continue-movie-meta" className="mt-2 px-0.5">
                    <p className="truncate text-xs font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium tabular-nums text-white/75">
                      {getRemainingMinutesLabel(item.title, item.totalMinutes ?? 120, item.remainingMinutes ?? 86)}
                    </p>
                  </div>
                )}
              </div>
            );
          }}
        />
      </section>
    );
  }

  if (section.variant === 'ranked') {
    return (
      <section className="mt-8 px-6 lg:px-12">
        <div className="mb-4 flex items-center gap-2">
          <Icon className="h-5 w-5 text-white" />
          <h2 className="text-xl font-bold text-white">{section.title}</h2>
        </div>
        <VirtualizedCardStrip
          items={section.items}
          getKey={(item) => item.title}
          itemWidthPx={192}
          renderCard={(item, i) => (
            <button
              type="button"
              data-tv-focusable="true"
              aria-label={`Play ${item.title}`}
              onClick={() => onPlay(item.title, item.contentType)}
              key={item.title}
              className={`tv-focusable group relative h-64 w-44 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-transparent bg-gradient-to-br text-left ${item.gradient} hover:scale-105 hover:border-white/60 lg:h-72 lg:w-48`}
            >
              <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
              <span className="absolute left-3 top-2 text-5xl font-black leading-none text-white/90">{i + 1}</span>
            </button>
          )}
        />
      </section>
    );
  }

  return (
    <section className="mt-8 px-6 lg:px-12">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-white" />
        <h2 className="text-xl font-bold text-white">{section.title}</h2>
      </div>
      <VirtualizedCardStrip
        items={section.items}
        getKey={(item) => item.title}
        itemWidthPx={176}
        renderCard={(item) => (
          <button
            type="button"
            data-tv-focusable="true"
            aria-label={`Play ${item.title}`}
            onClick={() => onPlay(item.title, item.contentType)}
            key={item.title}
            className={`tv-focusable group relative h-56 w-40 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-transparent bg-gradient-to-br text-left ${item.gradient} hover:scale-105 hover:border-white/60 lg:h-64 lg:w-44`}
          >
            <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
            <Play className="absolute left-3 top-3 h-5 w-5 fill-white text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      />
    </section>
  );
}

const LANGUAGE_NAMES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'];

const ADMIN_ACCENT = 'from-[#f5a900]/70 via-[#d87900]/20 to-[#050509]';

export default function Home() {
  const { data: adminSlides = [] } = useQuery({
    queryKey: ['home', 'banners'],
    queryFn: async (): Promise<Slide[]> => {
      const { data, error } = await supabase
        .from('shows')
        .select('id, title, banner_url, thumbnail_url, content_type, category, release_year, rating, languages, genres, banner_start_at, banner_end_at')
        .eq('is_featured', true)
        .eq('is_published', true)
        .order('updated_at', { ascending: false });
      if (error) return [];
      return (data ?? [])
        .filter((s) => {
          const now = Date.now();
          if (s.banner_start_at && Date.parse(s.banner_start_at) > now) return false;
          if (s.banner_end_at && Date.parse(s.banner_end_at) <= now) return false;
          return Boolean(s.banner_url || s.thumbnail_url);
        })
        .map((s) => ({
          title: s.title,
          subtitle: s.content_type === 'series' ? 'Web Series' : s.content_type === 'video' ? 'Video' : 'Movie',
          contentType: (s.content_type === 'series' || s.content_type === 'video' ? s.content_type : 'movie') as 'movie' | 'series' | 'video',
          year: s.release_year ? String(s.release_year) : '2025',
          languages: s.languages?.length ? `${s.languages.length} Languages` : 'Hindi',
          genre: s.genres?.[0] || s.category || 'Featured',
          rating: s.rating != null ? String(s.rating) : 'New',
          artwork: s.banner_url || s.thumbnail_url || '',
          accent: ADMIN_ACCENT,
          glow: 'rgba(238,153,0,0.13)',
        }));
    },
    staleTime: 0,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const [playing, setPlaying] = useState<string | null>(null);
  const [playingType, setPlayingType] = useState<'movie' | 'series' | 'video' | undefined>();
  const { data: addedVideos = [] } = useQuery({
    queryKey: ['home', 'added-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('id, title, thumbnail_url, banner_url, video_url, content_type, release_year')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) return [];
      return data ?? [];
    },
    staleTime: 0,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const [playingSrc, setPlayingSrc] = useState<string | undefined>();
  const playVideo = (title: string, url?: string | null, type?: 'movie' | 'series' | 'video') => {
    const ok = url && /^https?:\/\/.+\.(mp4|webm|m3u8|mov)(\?|$)/i.test(url);
    setPlayingSrc(ok ? url : undefined);
    setPlayingType(type);
    setPlaying(title);
  };
  const slides = adminSlides.length ? [...adminSlides, ...defaultSlides] : defaultSlides;

  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sharedTitle = new URLSearchParams(window.location.search).get('watch');
    if (sharedTitle) setPlaying(sharedTitle.slice(0, 200));
  }, []);

  const closePlayer = () => {
    setPlaying(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('watch')) {
      url.searchParams.delete('watch');
      window.history.replaceState(window.history.state, '', url.href);
    }
  };

  const goTo = (index: number) => {
    if (isAnimating || index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    window.setTimeout(() => setIsAnimating(false), 600);
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % slides.length);
    }, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, isAnimating, slides.length]);

  const slide = slides[current % slides.length];
  if (!slide) return null;

  return (
    <div className="min-h-screen bg-nova-black">
      {/* 3D stacked hero slider (GPU-friendly without heavy blur-3xl passes) */}
      <section className="relative w-full overflow-hidden pt-20 pb-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500"
          style={{ background: `radial-gradient(60% 50% at 50% 40%, ${slide.glow.replace('0.13', '0.35')}, transparent)` }}
        />
        <div className="relative mx-auto h-[440px] max-w-6xl [perspective:1400px] [--step:62%] md:h-[420px] md:[--step:56%] lg:h-[500px] lg:[--step:50%]">
          {slides.map((s, i) => {
            let offset = i - current;
            const n = slides.length;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            if (Math.abs(offset) > 2) return null;
            const isActive = offset === 0;
            return (
              <article
                key={s.title}
                onClick={() => !isActive && goTo(i)}
                className={`absolute left-1/2 top-0 h-[420px] w-[280px] overflow-hidden rounded-2xl border will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-[400px] md:w-[640px] md:rounded-3xl lg:h-[480px] lg:w-[860px] lg:rounded-[32px] ${
                  isActive
                    ? 'cursor-default border-nova-accent/50 shadow-[0_0_40px_-10px_var(--color-nova-red)]'
                    : 'cursor-pointer border-nova-line'
                }`}
                style={{
                  transform: `translateX(calc(-50% + var(--step) * ${offset})) translateZ(${-Math.abs(offset) * 160}px) rotateY(${offset * -18}deg) scale(${isActive ? 1 : 0.86})`,
                  zIndex: 10 - Math.abs(offset),
                  opacity: Math.abs(offset) === 2 ? 0.35 : isActive ? 1 : 0.7,
                }}
              >
                <PosterImage
                  src={s.artwork}
                  alt={s.title}
                  width={900}
                  eager={isActive}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {!isActive && <div className="absolute inset-0 bg-nova-black/45" />}
                {isActive && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/15 bg-[#0f1219]/[0.92] px-2.5 py-1 text-[11px] font-semibold text-white">
                    <Star className="h-3 w-3 fill-white text-white" /> IMDb {s.rating}
                  </span>
                )}
              </article>
            );
          })}
        </div>

        {/* Details below the card */}
        <div className="relative z-20 mx-auto mt-4 max-w-sm px-6 text-center md:max-w-2xl lg:max-w-4xl">
          <span className="nova-pill rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
            {slide.subtitle}
          </span>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-[0.2em] text-white md:text-5xl">{slide.title}</h1>
          <p className="mt-1 text-xs text-white">
            {slide.genre} • {slide.year}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {LANGUAGE_NAMES.slice(0, parseInt(slide.languages, 10) || 1).map((lang) => (
              <span key={lang} className="nova-pill rounded-full border border-nova-line px-2.5 py-0.5 text-[11px] text-white">
                {lang}
              </span>
            ))}
          </div>
          <div data-tv-row="true" className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="novaAction"
              data-tv-focusable="true"
              aria-label={`Play ${slide.title}`}
              onClick={() => playVideo(slide.title, undefined, slide.contentType)}
              className="tv-focusable nova-pill-solid flex h-12 items-center gap-2.5 rounded-full pl-2.5 pr-6 font-semibold text-white shadow-lg hover:scale-105"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
                <Play className="h-4 w-4 fill-white text-white" />
              </span>
              Watch Now
            </Button>
            <BannerWatchlist key={slide.title} title={slide.title} />
          </div>
        </div>
      </section>

      {/* Virtualized content rows: off-screen rows unmount cleanly to save TV RAM */}
      <div className="pb-24 lg:pb-12">
        {addedVideos.length > 0 && (
          <section className="mt-8 px-6 lg:px-12">
            <h2 className="mb-4 text-xl font-bold">Latest on NOVA</h2>
            <div data-tv-row="true" className="tv-scroll-row flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {addedVideos.map((v) => {
                const art = v.thumbnail_url || v.banner_url;
                const ct = v.content_type === 'series' || v.content_type === 'video' ? v.content_type : 'movie';
                return (
                  <button
                    type="button"
                    key={v.id}
                    data-tv-focusable="true"
                    onClick={() => playVideo(v.title, v.video_url, ct)}
                    aria-label={`Play ${v.title}`}
                    className="tv-focusable group relative h-52 w-36 flex-shrink-0 overflow-hidden rounded-xl border border-transparent bg-gradient-to-br from-nova-red/60 to-nova-card text-left hover:scale-105 lg:h-60 lg:w-40"
                  >
                    {art && (
                      <PosterImage
                        src={art}
                        alt={v.title}
                        width={360}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-nova-black/90 via-transparent to-transparent" />
                    <Play className="absolute left-2 top-2 h-5 w-5 fill-nova-text text-nova-text opacity-80" />
                  </button>
                );
              })}
            </div>
          </section>
        )}
        <VirtualizedRowList
          items={sections}
          getKey={(section) => section.title}
          estimateRowHeight={296}
          overscan={2}
          initialMountedCount={4}
          renderRow={(section) => (
            <SectionRow
              section={section}
              onPlay={(t, ct) => playVideo(t, undefined, ct)}
            />
          )}
        />
      </div>
      {playing && <ResumePlayer title={playing} src={playingSrc} contentType={playingType} onClose={closePlayer} />}
    </div>
  );
}
