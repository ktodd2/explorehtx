import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Calendar, MapPin, Ticket, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Event } from '@/types/database';
import './embed.css';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: 'light' | 'dark' }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Event Embed - ${slug}`,
    robots: { index: false, follow: false },
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
    console.error('Error fetching event for embed:', error.message);
    return null;
  }

  return data as Event | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPrice(event: Event): string {
  if (event.is_free) return 'Free';
  if (event.price_min && event.price_max) {
    return `$${event.price_min} - $${event.price_max}`;
  }
  if (event.price_min) return `From $${event.price_min}`;
  return 'See details';
}

export default async function EmbedPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { theme = 'light' } = await searchParams;
  const event = await fetchEvent(slug);

  if (!event) notFound();

  const eventUrl = `https://explorehtx.us.com/events/${event.slug}`;
  const isDark = theme === 'dark';

  return (
    <html lang="en">
      <body className={`embed-body ${isDark ? 'dark' : ''}`}>
        <article className={`embed-card ${isDark ? 'dark' : ''}`}>
          {/* Image */}
          {event.image_url && (
            <div className="embed-image">
              <img src={event.image_url} alt={event.image_alt || event.title} />
            </div>
          )}

          {/* Content */}
          <div className="embed-content">
            {/* Title */}
            <h2 className="embed-title">
              <a href={eventUrl} target="_blank" rel="noopener noreferrer">
                {event.title}
              </a>
            </h2>

            {/* Details */}
            <div className="embed-details">
              <div className="embed-detail">
                <Calendar className="embed-icon" />
                <span>{formatDate(event.start_date)}</span>
              </div>

              {event.venue_name && (
                <div className="embed-detail">
                  <MapPin className="embed-icon" />
                  <span>{event.venue_name}</span>
                </div>
              )}

              <div className="embed-detail">
                <Ticket className="embed-icon" />
                <span>{formatPrice(event)}</span>
              </div>
            </div>

            {/* CTA */}
            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="embed-cta"
            >
              View Event
              <ExternalLink className="embed-cta-icon" />
            </a>

            {/* Attribution */}
            <a
              href="https://explorehtx.us.com"
              target="_blank"
              rel="noopener noreferrer"
              className="embed-attribution"
            >
              Powered by ExploreHTX
            </a>
          </div>
        </article>
      </body>
    </html>
  );
}
