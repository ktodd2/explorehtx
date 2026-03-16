const BASE_URL = 'https://explorehtx.us.com';

/**
 * Schema.org WebSite structured data with SearchAction for Google Sitelinks
 * search box. Include once in the root layout or homepage.
 */
export default function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ExploreHTX',
    alternateName: 'Explore HTX',
    url: BASE_URL,
    description:
      'Discover the best Houston events, concerts, food, nightlife, and things to do. Your local guide to the Bayou City.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
