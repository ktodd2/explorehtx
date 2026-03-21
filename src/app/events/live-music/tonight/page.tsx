import type { Metadata } from 'next';
import Link from 'next/link';
import { Music, ChevronRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventGrid from '@/components/events/EventGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Live Music Tonight in Houston | Shows & Concerts',
  description:
    'Find live music happening tonight in Houston. Concerts, shows, and performances starting today — updated in real-time.',
  alternates: {
    canonical: 'https://explorehtx.us.com/events/live-music/tonight',
  },
  openGraph: {
    title: 'Live Music Tonight in Houston | ExploreHTX',
    description: 'Find live music happening tonight in Houston. Updated in real-time.',
    url: 'https://explorehtx.us.com/events/live-music/tonight',
    type: 'website',
  },
};

function getTonightRange(): { start: string; end: string } {
  // Houston is in Central Time (UTC-6 / UTC-5 DST)
  const now = new Date();

  // Get today at midnight in Houston time
  const houstonOffset = -6 * 60; // CST (adjust if needed for DST)
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const houstonNow = new Date(utcNow + houstonOffset * 60000);

  // Start of today (already past, so use current time)
  const start = now.toISOString();

  // End of today (11:59:59 PM Houston time)
  const endOfDay = new Date(houstonNow);
  endOfDay.setHours(23, 59, 59, 999);

  // Convert back to UTC
  const endUtc = new Date(endOfDay.getTime() - houstonOffset * 60000);

  return { start, end: endUtc.toISOString() };
}

export default async function LiveMusicTonightPage() {
  const supabase = await createClient();
  const { start, end } = getTonightRange();

  const { data: events, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('category', 'music-concerts')
    .eq('status', 'active')
    .gte('start_date', start)
    .lte('start_date', end)
    .order('start_date', { ascending: true });

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Events', href: '/events' },
          { name: 'Live Music', href: '/events/live-music' },
          { name: 'Tonight', href: '/events/live-music/tonight' },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-purple-700 to-indigo-900 py-14 sm:py-20 overflow-hidden">
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
            <Link href="/events/live-music" className="hover:text-white transition-colors">
              Live Music
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Tonight</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              Tonight
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
              <Music className="w-3.5 h-3.5" />
              Live Music
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Live Music Tonight
          </h1>
          <p className="mt-4 text-white/80 text-lg max-w-2xl leading-relaxed">
            {formattedDate} — find a show happening in Houston right now.
          </p>
          <p className="mt-3 text-white/60 text-sm">
            {count ?? 0} {count === 1 ? 'show' : 'shows'} tonight
          </p>
        </div>
      </section>

      {/* Events grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {events && events.length > 0 ? (
          <EventGrid events={events as Event[]} />
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
              <Music className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
              No Shows Tonight
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like it&apos;s a quiet night. Check out upcoming shows or explore other events happening in Houston.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/events/live-music"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
              >
                <Music className="w-5 h-5" />
                All Upcoming Shows
              </Link>
              <Link
                href="/events/today"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
              >
                All Events Today
              </Link>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/events/live-music"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            View all upcoming live music
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
