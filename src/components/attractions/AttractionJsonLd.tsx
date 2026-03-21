import type { Attraction, AttractionCategory } from '@/types/database';

interface AttractionJsonLdProps {
  attraction: Attraction;
  category?: AttractionCategory | null;
}

export default function AttractionJsonLd({ attraction, category }: AttractionJsonLdProps) {
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

  for (const [day, hours] of Object.entries(attraction.hours)) {
    if (hours && dayMap[day]) {
      openingHours.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayMap[day],
        opens: hours.open,
        closes: hours.close,
      });
    }
  }

  // Map price_type to Schema.org isAccessibleForFree
  const isAccessibleForFree = attraction.price_type === 'free';

  // Build the JSON-LD object
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attraction.name,
    description: attraction.description ?? attraction.short_description ?? undefined,
    url: `${baseUrl}/things-to-do/${attraction.slug}`,

    // Image
    ...(attraction.image_url
      ? {
          image: {
            '@type': 'ImageObject',
            url: attraction.image_url,
            ...(attraction.image_alt ? { caption: attraction.image_alt } : {}),
          },
        }
      : {}),

    // Address & Location
    ...(attraction.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: attraction.address,
            addressLocality: 'Houston',
            addressRegion: 'TX',
            addressCountry: 'US',
          },
        }
      : {}),

    ...(attraction.lat != null && attraction.lng != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: attraction.lat,
            longitude: attraction.lng,
          },
        }
      : {}),

    // Contact
    ...(attraction.phone ? { telephone: attraction.phone } : {}),

    // Opening Hours
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),

    // Accessibility
    isAccessibleForFree,

    // Price
    ...(attraction.price_range && !isAccessibleForFree
      ? { priceRange: attraction.price_range }
      : {}),

    // Category
    ...(category
      ? {
          touristType: category.name,
        }
      : {}),

    // Features as amenity feature
    ...(attraction.features.length > 0
      ? {
          amenityFeature: attraction.features.map((feature) => ({
            '@type': 'LocationFeatureSpecification',
            name: feature,
            value: true,
          })),
        }
      : {}),

    // Typical visit duration
    ...(attraction.duration_minutes
      ? {
          tourBookingPage: `${baseUrl}/things-to-do/${attraction.slug}`,
        }
      : {}),

    // Public access
    publicAccess: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
