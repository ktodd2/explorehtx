import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Ticket,
  Users,
  ChevronRight,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventCard from '@/components/events/EventCard';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Venue, Event } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('venues')
    .select('name, description, image_url')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) {
    return { title: 'Venue Not Found' };
  }

  const title = `${data.name} | Houston Venue`;
  const description = data.description
    ? data.description.slice(0, 155)
    : `Events and shows at ${data.name} in Houston, TX. Find upcoming concerts, sports, and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://explorehtx.us.com/venues/${slug}`,
    },
    openGraph: {
      title: `${data.name} | ExploreHTX`,
      description,
      url: `https://explorehtx.us.com/venues/${slug}`,
      type: 'website',
      ...(data.image_url && {
        images: [{ url: data.image_url, alt: data.name }],
      }),
    },
  };
}

async function fetchVenue(slug: string): Promise<Venue | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error fetching venue:', error.message);
    return null;
  }

  return data as Venue | null;
}

async function fetchVenueEvents(venueId: string, venueName: string): Promise<Event[]> {
  const supabase = await createClient();

  // Try by venue_id first, then by venue_name
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(12);

  // Try venue_id match first
  const { data: byId } = await query.eq('venue_id', venueId);
  if (byId && byId.length > 0) {
    return byId as Event[];
  }

  // Fallback to venue_name match
  const { data: byName } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .ilike('venue_name', venueName)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(12);

  return (byName as Event[]) ?? [];
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const venue = await fetchVenue(slug);

  if (!venue) notFound();

  const events = await fetchVenueEvents(venue.id, venue.name);

  const mapsQuery = venue.address
    ? encodeURIComponent(venue.address)
    : encodeURIComponent(`${venue.name}, Houston TX`);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Venues', href: '/venues' },
          { name: venue.name, href: `/venues/${venue.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-space-blue-800 to-space-blue-950 py-14 sm:py-20 overflow-hidden">
        {venue.image_url && (
          <>
            <Image
              src={venue.image_url}
              alt={venue.image_alt || venue.name}
              fill
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-blue-950 via-space-blue-900/80 to-transparent" />
          </>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/venues" className="hover:text-white transition-colors">
              Venues
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{venue.name}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
              <Building2 className="w-3.5 h-3.5" />
              Venue
            </span>
            {venue.venue_type && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
                {venue.venue_type}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            {venue.name}
          </h1>

          {venue.short_description && (
            <p className="mt-4 text-white/80 text-lg max-w-2xl">
              {venue.short_description}
            </p>
          )}

          <p className="mt-3 text-white/60 text-sm">
            {events.length} upcoming {events.length === 1 ? 'event' : 'events'}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {venue.description && (
              <section>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                  About {venue.name}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {venue.description}
                </p>
              </section>
            )}

            {/* Features */}
            {venue.features && venue.features.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Features
                </h2>
                <div className="flex flex-wrap gap-2">
                  {venue.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Events */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-gray-900">
                  Upcoming Events
                </h2>
                {events.length > 0 && (
                  <Link
                    href={`/events?venue=${encodeURIComponent(venue.name)}`}
                    className="text-sm text-sunset-orange-600 hover:text-sunset-orange-700 font-medium flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No upcoming events scheduled at this venue.
                  </p>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2 text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
                  >
                    Browse All Events
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              {/* Location */}
              {(venue.address || venue.neighborhood) && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-space-blue-100 text-space-blue-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      Location
                    </p>
                    {venue.address && (
                      <p className="text-sm text-gray-900">{venue.address}</p>
                    )}
                    {venue.neighborhood && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {venue.neighborhood}
                      </p>
                    )}
                    <a
                      href={`https://maps.google.com/?q=${mapsQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-space-blue-600 hover:text-space-blue-800 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Get Directions
                    </a>
                  </div>
                </div>
              )}

              {/* Capacity */}
              {venue.capacity && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      Capacity
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {venue.capacity.toLocaleString()} seats
                    </p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {venue.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      Phone
                    </p>
                    <a
                      href={`tel:${venue.phone}`}
                      className="text-sm text-gray-900 hover:text-space-blue-600"
                    >
                      {venue.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {venue.website_url && (
                <a
                  href={venue.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full py-3 px-4 bg-space-blue-900 hover:bg-space-blue-800 text-white font-semibold text-sm rounded-xl transition-colors text-center justify-center"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                </a>
              )}

              {/* Booking */}
              {venue.booking_url && (
                <a
                  href={venue.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full py-3 px-4 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold text-sm rounded-xl transition-colors text-center justify-center"
                >
                  <Ticket className="w-4 h-4" />
                  Book Tickets
                </a>
              )}
            </div>

            {/* Back link */}
            <Link
              href="/venues"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              All Venues
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
