export const revalidate = 3600;

import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventGrid from '@/components/events/EventGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Free Things to Do in Houston',
  description:
    'Discover the best free events and things to do in Houston. From free concerts and outdoor movies to museum days and community festivals — no budget needed.',
  alternates: {
    canonical: 'https://explorehtx.us.com/events/free',
  },
  openGraph: {
    title: 'Free Things to Do in Houston | ExploreHTX',
    description:
      'The best free events in Houston — concerts, outdoor movies, museum days, festivals, and more.',
    url: 'https://explorehtx.us.com/events/free',
    type: 'website',
  },
};

export default async function FreeEventsPage() {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .eq('is_free', true)
    .gte('start_date', new Date().toISOString())
    .order('featured', { ascending: false })
    .order('start_date', { ascending: true })
    .limit(48);

  const events = (data as Event[]) ?? [];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Events', href: '/events' },
          { name: 'Free Events', href: '/events/free' },
        ]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 to-emerald-950 py-12 sm:py-16 overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
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
            <span className="text-white">Free Events</span>
          </nav>

          <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-3">
            <Gift className="w-4 h-4" />
            Zero cost, all fun
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Free Things To Do in Houston
          </h1>
          <p className="mt-4 text-emerald-100 text-lg max-w-2xl leading-relaxed">
            Houston&apos;s best events don&apos;t always require a ticket.
            Discover {count ?? 0} upcoming free{' '}
            {(count ?? 0) === 1 ? 'event' : 'events'} — concerts, festivals,
            markets, outdoor movies, and more.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <EventGrid
          events={events}
          emptyMessage="No free events found right now. Check back soon — Houston always has something free happening!"
        />

        {(count ?? 0) > 48 && (
          <p className="mt-8 text-center text-sm text-gray-400">
            Showing 48 of {count} free events.{' '}
            <Link
              href="/events?free=true"
              className="text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
            >
              Browse all with filters
            </Link>
          </p>
        )}

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
