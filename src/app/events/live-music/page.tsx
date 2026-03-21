import type { Metadata } from 'next';
import Link from 'next/link';
import { Music, ChevronRight, Clock, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventGrid from '@/components/events/EventGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Live Music in Houston | Concerts & Shows',
  description:
    'Find live music tonight and this week in Houston. Concerts, local bands, DJ sets, and more — your guide to Houston\'s music scene.',
  alternates: {
    canonical: 'https://explorehtx.us.com/events/live-music',
  },
  openGraph: {
    title: 'Live Music in Houston | ExploreHTX',
    description:
      'Find live music tonight and this week in Houston. Concerts, local bands, DJ sets, and more.',
    url: 'https://explorehtx.us.com/events/live-music',
    type: 'website',
  },
};

const QUICK_FILTERS = [
  {
    label: 'Tonight',
    href: '/events/live-music/tonight',
    icon: Clock,
    description: 'Playing now',
  },
  {
    label: 'This Weekend',
    href: '/events/this-weekend?category=music-concerts',
    icon: Calendar,
    description: 'Weekend shows',
  },
];

export default async function LiveMusicPage() {
  const supabase = await createClient();

  const { data: events, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('category', 'music-concerts')
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString())
    .order('featured', { ascending: false })
    .order('start_date', { ascending: true })
    .limit(48);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Events', href: '/events' },
          { name: 'Live Music', href: '/events/live-music' },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-purple-600 to-purple-900 py-14 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('/images/houston-pattern.svg')]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/events" className="hover:text-white transition-colors">
              Events
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Live Music</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
              <Music className="w-3.5 h-3.5" />
              Live Music
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Live Music in Houston
          </h1>
          <p className="mt-4 text-white/80 text-lg max-w-2xl leading-relaxed">
            Concerts, local bands, touring artists, and DJ sets — find your next show in the Bayou City.
          </p>
          <p className="mt-3 text-white/60 text-sm">
            {count ?? 0} upcoming {count === 1 ? 'show' : 'shows'}
          </p>
        </div>
      </section>

      {/* Quick filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 gap-4 max-w-md">
          {QUICK_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <Link
                key={filter.href}
                href={filter.href}
                className="group bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-purple-200 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{filter.label}</h3>
                    <p className="text-sm text-gray-500">{filter.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Events grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
          All Upcoming Shows
        </h2>
        <EventGrid
          events={(events as Event[]) ?? []}
          emptyMessage="No upcoming live music events right now. Check back soon!"
        />

        {(count ?? 0) > 48 && (
          <p className="mt-8 text-center text-sm text-gray-400">
            Showing 48 of {count} shows.{' '}
            <Link
              href="/events?category=music-concerts"
              className="text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
            >
              Browse all with filters
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
