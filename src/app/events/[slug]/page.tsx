import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Tag,
  ExternalLink,
  Share2,
  Twitter,
  Facebook,
  ChevronRight,
  Ticket,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventJsonLd from '@/components/events/EventJsonLd';
import EventCard from '@/components/events/EventCard';
import AddToCalendarButton from '@/components/events/AddToCalendarButton';
import SaveEventButton from '@/components/events/SaveEventButton';
import EmbedCodeGenerator from '@/components/events/EmbedCodeGenerator';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { formatDateRange, formatEventDate } from '@/lib/utils/dates';
import { formatPrice, categoryDisplayName, truncate } from '@/lib/utils/format';
import type { Event } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('title, description, image_url, image_alt, start_date, category')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) {
    return { title: 'Event Not Found' };
  }

  const title = `${data.title} | Houston Events`;
  const description = data.description
    ? truncate(data.description, 155)
    : `${data.title} — happening in Houston. Find tickets, venue info, and more on ExploreHTX.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://explorehtx.us.com/events/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://explorehtx.us.com/events/${slug}`,
      type: 'article',
      ...(data.image_url
        ? {
            images: [
              {
                url: data.image_url,
                alt: data.image_alt ?? data.title,
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: data.image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(data.image_url ? { images: [data.image_url] } : {}),
    },
  };
}

async function fetchEvent(slug: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error fetching event:', error.message);
    return null;
  }

  return data as Event | null;
}

async function fetchRelatedEvents(
  event: Event,
  limit = 3
): Promise<Event[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .eq('category', event.category)
    .neq('id', event.id)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);

  return (data as Event[]) ?? [];
}

const CATEGORY_GRADIENT: Record<string, string> = {
  'music-concerts': 'from-purple-700 to-purple-950',
  'sports': 'from-green-700 to-green-950',
  'food-dining': 'from-amber-600 to-amber-900',
  'arts-culture': 'from-pink-600 to-pink-950',
  'nightlife': 'from-indigo-700 to-indigo-950',
  'family-kids': 'from-cyan-600 to-cyan-900',
  'outdoor-parks': 'from-emerald-600 to-emerald-950',
  'festivals': 'from-rose-600 to-rose-900',
  'comedy': 'from-yellow-500 to-amber-800',
  'theater': 'from-fuchsia-600 to-fuchsia-950',
  'markets-shopping': 'from-orange-500 to-orange-800',
};

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  if (!event) notFound();

  const [relatedEvents] = await Promise.all([fetchRelatedEvents(event)]);

  const gradient =
    CATEGORY_GRADIENT[event.category] ?? 'from-space-blue-700 to-space-blue-950';
  const price = formatPrice(event.price_min, event.price_max, event.is_free);
  const categoryName = categoryDisplayName(event.category);
  const dateDisplay = formatDateRange(event.start_date, event.end_date ?? undefined);
  const pageUrl = `https://explorehtx.us.com/events/${event.slug}`;

  const mapsQuery = event.venue_address
    ? encodeURIComponent(event.venue_address)
    : event.venue_name
    ? encodeURIComponent(`${event.venue_name}, Houston TX`)
    : null;

  return (
    <>
      <EventJsonLd event={event} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Events', href: '/events' },
          { name: categoryName, href: `/events/category/${event.category}` },
          { name: event.title, href: `/events/${event.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] bg-gray-900 overflow-hidden flex items-end">
        {event.image_url ? (
          <>
            <Image
              src={event.image_url}
              alt={event.image_alt ?? event.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent" />
          </>
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
            aria-hidden="true"
          />
        )}

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-sm text-white/60 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/events" className="hover:text-white transition-colors">
              Events
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/events/category/${event.category}`}
              className="hover:text-white transition-colors"
            >
              {categoryName}
            </Link>
          </nav>

          {/* Category + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Link
              href={`/events/category/${event.category}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-white/30 transition-colors border border-white/20"
            >
              <Tag className="w-3.5 h-3.5" />
              {categoryName}
            </Link>
            {event.is_free && (
              <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full">
                Free
              </span>
            )}
            {event.featured && (
              <span className="px-3 py-1 bg-sunset-orange-500 text-white text-sm font-bold rounded-full">
                Featured
              </span>
            )}
            {event.status === 'cancelled' && (
              <span className="px-3 py-1 bg-houston-red text-white text-sm font-bold rounded-full">
                Cancelled
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-4xl">
            {event.title}
          </h1>

          {event.organizer_name && (
            <p className="mt-3 text-white/70 text-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              By {event.organizer_name}
            </p>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                About This Event
              </h2>
              {event.description_html ? (
                <div
                  className="prose prose-gray max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: event.description_html }}
                />
              ) : event.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              ) : (
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>
                    <strong>{event.title}</strong> is a{' '}
                    {categoryName.toLowerCase()} event happening in Houston
                    {event.venue_name ? ` at ${event.venue_name}` : ''}.
                  </p>
                  <p>
                    <strong>When:</strong> {dateDisplay}
                    {event.is_all_day ? ' (All day)' : ''}
                  </p>
                  {event.venue_name && (
                    <p>
                      <strong>Where:</strong> {event.venue_name}
                      {event.venue_address ? `, ${event.venue_address}` : ''}
                    </p>
                  )}
                  <p>
                    <strong>Admission:</strong> {price}
                  </p>
                  {event.ticket_url && (
                    <p>
                      Visit the event page for full details, ticket availability, and more information.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Share */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Share This Event
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
                <button
                  onClick={undefined}
                  data-copy-url={pageUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  aria-label="Copy link"
                  type="button"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            </section>

            {/* Source link */}
            {event.source_url && (
              <a
                href={event.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Original event listing
              </a>
            )}
          </div>

          {/* Right — sidebar */}
          <aside className="space-y-5">
            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              {/* Price + CTA */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Price
                  </p>
                  <p
                    className={`text-2xl font-extrabold ${
                      event.is_free
                        ? 'text-emerald-600'
                        : 'text-space-blue-900'
                    }`}
                  >
                    {price}
                  </p>
                </div>

                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-md shadow-sunset-orange-500/25"
                  >
                    <Ticket className="w-4 h-4" />
                    Get Tickets
                  </a>
                )}
              </div>

              {/* Add to Calendar + Save */}
              <div className="flex flex-wrap gap-2">
                <AddToCalendarButton
                  title={event.title}
                  description={event.description ?? ''}
                  startDate={event.start_date}
                  endDate={event.end_date}
                  location={event.venue_name ? `${event.venue_name}${event.venue_address ? `, ${event.venue_address}` : ''}` : event.venue_address ?? 'Houston, TX'}
                  url={pageUrl}
                />
                <SaveEventButton eventId={event.id} showLabel />
              </div>

              <hr className="border-gray-100" />

              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sunset-orange-100 text-sunset-orange-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    Date & Time
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {dateDisplay}
                  </p>
                  {event.is_all_day && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      All day event
                    </p>
                  )}
                </div>
              </div>

              {/* Venue */}
              {(event.venue_name || event.venue_address || event.neighborhood) && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-space-blue-100 text-space-blue-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      Location
                    </p>
                    {event.venue_name && (
                      <p className="text-sm font-medium text-gray-900">
                        {event.venue_name}
                      </p>
                    )}
                    {event.venue_address && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {event.venue_address}
                      </p>
                    )}
                    {event.neighborhood && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.neighborhood}
                      </p>
                    )}
                    {mapsQuery && (
                      <a
                        href={`https://maps.google.com/?q=${mapsQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-space-blue-600 hover:text-space-blue-800 font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Organizer */}
              {event.organizer_name && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      Organizer
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {event.organizer_name}
                    </p>
                  </div>
                </div>
              )}

              {/* CTA if no ticket url but has source */}
              {!event.ticket_url && event.source_url && (
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 bg-space-blue-900 hover:bg-space-blue-800 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  View Event Details
                </a>
              )}
            </div>

            {/* Embed generator */}
            <EmbedCodeGenerator eventSlug={event.slug} eventTitle={event.title} />

            {/* Back link */}
            <Link
              href="/events"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              All Houston Events
            </Link>
          </aside>
        </div>

        {/* Related events */}
        {relatedEvents.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-gray-900">
                More {categoryName} Events
              </h2>
              <Link
                href={`/events/category/${event.category}`}
                className="text-sm text-sunset-orange-600 hover:text-sunset-orange-700 font-medium flex items-center gap-1 transition-colors"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((relEvent) => (
                <EventCard key={relEvent.id} event={relEvent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
