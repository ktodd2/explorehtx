const BASE_URL = 'https://explorehtx.us.com';

/**
 * Schema.org Organization structured data for brand visibility in search.
 * Include once on the homepage to help Google understand the brand entity.
 */
export default function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ExploreHTX',
    alternateName: 'Explore HTX',
    url: BASE_URL,
    description:
      'Your ultimate guide to Houston events, restaurants, nightlife, and things to do in the Bayou City.',
    foundingDate: '2024',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Greater Houston Area',
    },
    knowsAbout: [
      'Houston Events',
      'Houston Restaurants',
      'Houston Nightlife',
      'Houston Things To Do',
      'Houston Neighborhoods',
      'Houston Happy Hours',
      'Houston Live Music',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
