const BASE_URL = 'https://explorehtx.us.com';

/**
 * Schema.org LocalBusiness structured data for Houston-specific queries.
 * Signals to Google that this site serves the Greater Houston area.
 */
export default function LocalBusinessJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BASE_URL}/#localbusiness`,
    name: 'ExploreHTX',
    description:
      'Local guide to Houston events, restaurants, attractions, and things to do.',
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    image: `${BASE_URL}/images/og-image.jpg`,
    priceRange: 'Free',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Houston',
      addressRegion: 'TX',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 29.7604,
      longitude: -95.3698,
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 29.7604,
        longitude: -95.3698,
      },
      geoRadius: '50 mi',
    },
    serviceArea: {
      '@type': 'AdministrativeArea',
      name: 'Greater Houston Area',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
