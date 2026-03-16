import type { MetadataRoute } from 'next';

const BASE_URL = 'https://explorehtx.us.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/subscribe/verify', '/subscribe/unsubscribe'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
