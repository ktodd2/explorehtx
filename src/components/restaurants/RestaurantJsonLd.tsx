import type { Restaurant } from '@/types/database';

interface RestaurantJsonLdProps {
  restaurant: Restaurant;
}

export default function RestaurantJsonLd({ restaurant }: RestaurantJsonLdProps) {
  const baseUrl = 'https://explorehtx.us.com';

  // Build opening hours specification from hours JSONB
  const openingHours: Array<{
    '@type': string;
    dayOfWeek: string;
    opens: string;
    closes: string;
  }> = [];

  const dayMap: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  for (const [day, hours] of Object.entries(restaurant.hours)) {
    if (hours && dayMap[day]) {
      openingHours.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayMap[day],
        opens: hours.open,
        closes: hours.close,
      });
    }
  }

  // Map price range to Schema.org priceRange
  const priceRangeMap: Record<string, string> = {
    '$': '$',
    '$$': '$$',
    '$$$': '$$$',
    '$$$$': '$$$$',
  };

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    description: restaurant.description ?? undefined,
    url: `${baseUrl}/restaurants/${restaurant.slug}`,
    servesCuisine: [restaurant.cuisine_type, ...restaurant.cuisine_tags],
    priceRange: priceRangeMap[restaurant.price_range] || '$$',

    // Image
    ...(restaurant.image_url
      ? {
          image: {
            '@type': 'ImageObject',
            url: restaurant.image_url,
          },
        }
      : {}),

    // Address & Location
    ...(restaurant.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: restaurant.address,
            addressLocality: 'Houston',
            addressRegion: 'TX',
            addressCountry: 'US',
          },
        }
      : {}),

    ...(restaurant.lat != null && restaurant.lng != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: restaurant.lat,
            longitude: restaurant.lng,
          },
        }
      : {}),

    // Contact
    ...(restaurant.phone ? { telephone: restaurant.phone } : {}),
    ...(restaurant.menu_url
      ? {
          hasMenu: {
            '@type': 'Menu',
            url: restaurant.menu_url,
          },
        }
      : {}),

    // Opening Hours
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),

    // Accepts Reservations
    ...(restaurant.reservation_url
      ? {
          acceptsReservations: 'True',
          potentialAction: {
            '@type': 'ReserveAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: restaurant.reservation_url,
            },
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
