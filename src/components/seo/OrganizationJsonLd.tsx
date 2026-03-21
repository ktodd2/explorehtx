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
    logo: `${BASE_URL}/images/logo.png`,
    description:
      'Your ultimate guide to Houston events, restaurants, nightlife, and things to do in the Bayou City.',
    sameAs: [
      'https://instagram.com/explorehtx',
      'https://twitter.com/explorehtx',
      'https://facebook.com/explorehtx',
      'https://youtube.com/@explorehtx',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@explorehtx.us.com',
      availableLanguage: 'English',
    },
    foundingDate: '2024',
    knowsAbout: [
      'Houston Events',
      'Houston Restaurants',
      'Houston Nightlife',
      'Houston Things To Do',
      'Houston Neighborhoods',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
