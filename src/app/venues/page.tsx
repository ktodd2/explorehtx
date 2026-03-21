import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin, Calendar, ChevronRight, Ticket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Venue, Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Houston Venues | Concert Halls, Stadiums & Event Spaces',
  description:
    'Discover Houston venues for concerts, sports, theater, and events. Toyota Center, Minute Maid Park, and more — find upcoming events at every venue.',
  alternates: {
    canonical: 'https://explorehtx.us.com/venues',
  },
  openGraph: {
    title: 'Houston Venues | ExploreHTX',
    description: 'Discover Houston venues for concerts, sports, theater, and events.',
    url: 'https://explorehtx.us.com/venues',
    type: 'website',
  },
};

interface VenueWithCount extends Venue {
  event_count: number;
}

async function fetchVenues(): Promise<VenueWithCount[]> {
  const supabase = await createClient();

  // First, try to fetch from venues table
  const { data: venues, error } = await supabase
    .from('venues')
    .select('*')
    .eq('status', 'active')
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching venues:', error.message);
  }

  if (venues && venues.length > 0) {
    // Get event counts for each venue
    const venueIds = venues.map((v) => v.id);
    const { data: eventCounts } = await supabase
      .from('events')
      .select('venue_id')
      .in('venue_id', venueIds)
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString());

    const countMap = new Map<string, number>();
    eventCounts?.forEach((e) => {
      const current = countMap.get(e.venue_id) || 0;
      countMap.set(e.venue_id, current + 1);
    });

    return (venues as Venue[]).map((v) => ({
      ...v,
      event_count: countMap.get(v.id) || 0,
    }));
  }

  // Fallback: Extract unique venues from events
  const { data: events } = await supabase
    .from('events')
    .select('venue_name, venue_address, neighborhood')
    .eq('status', 'active')
    .not('venue_name', 'is', null)
    .gte('start_date', new Date().toISOString());

  if (!events) return [];

  // Group by venue name
  const venueMap = new Map<string, { count: number; address?: string; neighborhood?: string }>();
  events.forEach((e) => {
    if (e.venue_name) {
      const existing = venueMap.get(e.venue_name) || { count: 0 };
      venueMap.set(e.venue_name, {
        count: existing.count + 1,
        address: e.venue_address || existing.address,
        neighborhood: e.neighborhood || existing.neighborhood,
      });
    }
  });

  // Convert to venue-like objects
  const venueList: VenueWithCount[] = Array.from(venueMap.entries())
    .map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: null,
      short_description: null,
      address: data.address || null,
      neighborhood: data.neighborhood || null,
      lat: null,
      lng: null,
      phone: null,
      website_url: null,
      booking_url: null,
      venue_type: null,
      capacity: null,
      features: [],
      amenities: [],
      image_url: null,
      image_alt: null,
      gallery_urls: [],
      status: 'active' as const,
      featured: false,
      popularity_score: data.count,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      event_count: data.count,
    }))
    .sort((a, b) => b.event_count - a.event_count);

  return venueList;
}

export default async function VenuesPage() {
  const venues = await fetchVenues();

  // Group by venue type
  const venueTypes = new Map<string, VenueWithCount[]>();
  venues.forEach((venue) => {
    const type = venue.venue_type || 'Other Venues';
    if (!venueTypes.has(type)) venueTypes.set(type, []);
    venueTypes.get(type)!.push(venue);
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Venues', href: '/venues' },
        ]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-space-blue-800 to-space-blue-950 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sunset-orange-400 text-sm font-medium mb-3">
              <Building2 className="w-4 h-4" />
              Houston Venues
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Houston Event Venues
            </h1>
            <p className="mt-4 text-space-blue-200 text-lg leading-relaxed">
              Concert halls, stadiums, theaters, and event spaces across Houston.
              Find upcoming events at your favorite venues.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Venue grid */}
        {venues.length > 0 ? (
          <>
            {/* Featured venues */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Popular Venues
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.slice(0, 9).map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            </section>

            {/* By type */}
            {Array.from(venueTypes.entries()).map(([type, typeVenues]) => (
              <section key={type} className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{type}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {typeVenues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-500 text-center max-w-md mb-6">
              We&apos;re building venue profiles for Houston&apos;s top event
              spaces. Check back soon!
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Events
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function VenueCard({ venue }: { venue: VenueWithCount }) {
  const hasRealSlug = venue.slug && !venue.slug.startsWith('venue-');

  return (
    <Link
      href={hasRealSlug ? `/venues/${venue.slug}` : `/events?venue=${encodeURIComponent(venue.name)}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
    >
      {/* Image placeholder */}
      <div className="h-40 bg-gradient-to-br from-space-blue-600 to-space-blue-900 flex items-center justify-center">
        {venue.image_url ? (
          <Image
            src={venue.image_url}
            alt={venue.image_alt || venue.name}
            fill
            className="object-cover"
          />
        ) : (
          <Building2 className="w-12 h-12 text-white/40" />
        )}
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-sunset-orange-600 transition-colors">
          {venue.name}
        </h3>

        {venue.short_description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {venue.short_description}
          </p>
        )}

        <div className="mt-3 space-y-1.5">
          {venue.neighborhood && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-sunset-orange-500" />
              {venue.neighborhood}
            </div>
          )}
          {venue.venue_type && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Ticket className="w-3.5 h-3.5 text-sunset-orange-500" />
              {venue.venue_type}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-space-blue-700 font-medium">
            <Calendar className="w-4 h-4" />
            {venue.event_count} upcoming {venue.event_count === 1 ? 'event' : 'events'}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-sunset-orange-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
