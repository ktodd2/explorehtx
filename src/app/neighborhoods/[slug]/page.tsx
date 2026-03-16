import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Neighborhood, Event } from '@/types/database';
import EventCard from '@/components/events/EventCard';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

const BASE_URL = 'https://explorehtx.us.com';

interface NeighborhoodPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NeighborhoodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('name, meta_title, meta_description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!neighborhood) {
    return { title: 'Neighborhood Not Found | ExploreHTX' };
  }

  const title =
    neighborhood.meta_title ??
    `${neighborhood.name} Houston Events & Guide | ExploreHTX`;
  const description =
    neighborhood.meta_description ??
    `Discover the best events, restaurants, and things to do in ${neighborhood.name}, Houston. Your local neighborhood guide from ExploreHTX.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/neighborhoods/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/neighborhoods/${slug}`,
    },
  };
}

export default async function NeighborhoodPage({
  params,
}: NeighborhoodPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single<Neighborhood>();

  if (!neighborhood) notFound();

  // Upcoming events in this neighborhood (match by name)
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .eq('neighborhood', neighborhood.name)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(12)
    .returns<Event[]>();

  const upcomingEvents = events ?? [];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Neighborhoods', href: '/neighborhoods' },
          { name: neighborhood.name, href: `/neighborhoods/${slug}` },
        ]}
      />

      {/* Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative bg-space-blue-900 overflow-hidden">
        {neighborhood.image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${neighborhood.image_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-space-blue-900 via-space-blue-800 to-space-blue-700 opacity-85" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Back link */}
          <Link
            href="/neighborhoods"
            className="inline-flex items-center gap-1.5 text-space-blue-300 hover:text-white text-sm transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Neighborhoods
          </Link>

          <div className="inline-flex items-center gap-2 bg-sunset-orange-500/20 text-sunset-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Houston, Texas
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4">
            {neighborhood.name}
          </h1>

          {neighborhood.description && (
            <p className="text-lg text-space-blue-200 max-w-2xl leading-relaxed">
              {neighborhood.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-2 text-space-blue-300 text-sm">
            <Calendar className="w-4 h-4 text-sunset-orange-400" />
            <span>
              {upcomingEvents.length > 0
                ? `${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? 'event' : 'events'}`
                : 'No upcoming events'}
            </span>
          </div>
        </div>
      </section>

      {/* Events ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Upcoming Events in {neighborhood.name}
            </h2>
            {upcomingEvents.length > 0 && (
              <p className="mt-1 text-gray-500 text-sm">
                {upcomingEvents.length} event
                {upcomingEvents.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
          <Link
            href={`/events?neighborhood=${encodeURIComponent(neighborhood.name)}`}
            className="hidden sm:inline-flex items-center gap-2 text-sunset-orange-600 hover:text-sunset-orange-700 font-medium transition-colors text-sm"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <Calendar className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 text-lg mb-2">
              No upcoming events right now
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Check back soon or browse all Houston events.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse All Events
            </Link>
          </div>
        )}
      </section>

      {/* Map placeholder ─────────────────────────────────────────────────── */}
      {(neighborhood.lat !== null && neighborhood.lng !== null) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
            Where is {neighborhood.name}?
          </h2>
          <div className="w-full h-64 sm:h-80 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-space-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {neighborhood.name} — Houston, TX
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {neighborhood.lat?.toFixed(4)}, {neighborhood.lng?.toFixed(4)}
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
