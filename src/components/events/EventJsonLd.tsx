import type { Event } from '@/types/database';

interface EventJsonLdProps {
  event: Event;
}

export default function EventJsonLd({ event }: EventJsonLdProps) {
  const baseUrl = 'https://explorehtx.us.com';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description ?? undefined,
    url: `${baseUrl}/events/${event.slug}`,
    startDate: event.start_date,
    ...(event.end_date ? { endDate: event.end_date } : {}),
    eventStatus: event.status === 'cancelled'
      ? 'https://schema.org/EventCancelled'
      : event.status === 'postponed'
      ? 'https://schema.org/EventPostponed'
      : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.image_url
      ? {
          image: {
            '@type': 'ImageObject',
            url: event.image_url,
            description: event.image_alt ?? event.title,
          },
        }
      : {}),
    ...(event.venue_name
      ? {
          location: {
            '@type': 'Place',
            name: event.venue_name,
            ...(event.venue_address
              ? {
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: event.venue_address,
                    addressLocality: 'Houston',
                    addressRegion: 'TX',
                    addressCountry: 'US',
                  },
                }
              : {}),
            ...(event.venue_lat != null && event.venue_lng != null
              ? {
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: event.venue_lat,
                    longitude: event.venue_lng,
                  },
                }
              : {}),
          },
        }
      : {
          location: {
            '@type': 'Place',
            name: 'Houston, TX',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Houston',
              addressRegion: 'TX',
              addressCountry: 'US',
            },
          },
        }),
    ...(event.organizer_name
      ? {
          organizer: {
            '@type': 'Organization',
            name: event.organizer_name,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: event.ticket_url ?? `${baseUrl}/events/${event.slug}`,
      ...(event.is_free
        ? { price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }
        : event.price_min != null
        ? {
            price: String(event.price_min),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          }
        : { availability: 'https://schema.org/InStock' }),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
