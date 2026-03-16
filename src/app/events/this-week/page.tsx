export const revalidate = 3600;

import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventGrid from '@/components/events/EventGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { getThisWeek } from '@/lib/utils/dates';
import type { Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Things to Do in Houston This Week',
  description:
    "Plan your week in Houston with the best events happening from today through Sunday. Concerts, food, arts, sports and more.",
  alternates: {
    canonical: 'https://explorehtx.us.com/events/this-week',
  },
  openGraph: {
    title: 'Things to Do in Houston This Week | ExploreHTX',
    description:
      "The best Houston events happening this week — concerts, food, arts, sports, and more.",
    url: 'https://explorehtx.us.com/events/this-week',
    type: 'website',
  },
};

export default async function ThisWeekPage() {
  const { start, end } = getThisWeek();

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

  const weekStart = new Date(start).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });
  const weekEnd = new Date(end).toLocaleDateString('en-US', {
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
          { name: 'This Week', href: '/events/this-week' },
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
            <span className="text-white">This Week</span>
          </nav>

          <div className="flex items-center gap-2 text-sunset-orange-400 text-sm font-medium mb-3">
            <Calendar className="w-4 h-4" />
            {weekStart} – {weekEnd}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Houston Events This Week
          </h1>
          <p className="mt-4 text-space-blue-200 text-lg">
            {count ?? 0} {(count ?? 0) === 1 ? 'event' : 'events'} happening
            in Houston this week.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <EventGrid
          events={events}
          emptyMessage="No events found for this week. Browse upcoming events or check back Monday."
        />

        {events.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              href="/events/today"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              Today
            </Link>
            <Link
              href="/events/this-weekend"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              This Weekend
            </Link>
            <Link
              href="/events/this-month"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
            >
              This Month
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
