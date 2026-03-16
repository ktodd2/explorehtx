export const revalidate = 3600;

import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventGrid from '@/components/events/EventGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { getToday } from '@/lib/utils/dates';
import type { Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Things to Do in Houston Today',
  description:
    "What's happening in Houston today? Browse concerts, shows, food events, and activities happening right now in the Bayou City.",
  alternates: {
    canonical: 'https://explorehtx.us.com/events/today',
  },
  openGraph: {
    title: "Things to Do in Houston Today | ExploreHTX",
    description:
      "What's happening in Houston today? Browse today's concerts, shows, food events, and activities.",
    url: 'https://explorehtx.us.com/events/today',
    type: 'website',
  },
};

export default async function TodayPage() {
  const { start, end } = getToday();

  const supabase = await createClient();
  const { data, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .gte('start_date', start)
    .lte('start_date', end)
    .order('featured', { ascending: false })
    .order('start_date', { ascending: true })
    .limit(48);

  const events = (data as Event[]) ?? [];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Events', href: '/events' },
          { name: "Today's Events", href: '/events/today' },
        ]}
      />

      {/* Hero */}
      <section className="bg-space-blue-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <span className="text-white">Today</span>
          </nav>

          <div className="flex items-center gap-2 text-sunset-orange-400 text-sm font-medium mb-3">
            <Clock className="w-4 h-4" />
            {today}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Things To Do in Houston Today
          </h1>
          <p className="mt-4 text-space-blue-200 text-lg">
            {count ?? 0} {(count ?? 0) === 1 ? 'event' : 'events'} happening
            in Houston today.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <EventGrid
          events={events}
          emptyMessage="No events found for today. Check this weekend or browse all upcoming events."
        />

        {events.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              href="/events/this-weekend"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              This Weekend
            </Link>
            <Link
              href="/events/this-week"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              This Week
            </Link>
            <Link
              href="/events"
              className="px-5 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
            >
              All Events
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
