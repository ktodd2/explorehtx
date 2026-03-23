import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://explorehtx.us.com';

// Cache the sitemap for 1 hour — serves instantly for Googlebot instead of
// regenerating 7+ DB queries on every request (which times out on cold starts).
export const revalidate = 3600;

// Use a direct Supabase client (no cookies) so Next.js can cache this route.
// The cookie-based server client forces full dynamic rendering on every request.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 1.0,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events`,
      changeFrequency: 'hourly' as ChangeFrequency,
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/today`,
      changeFrequency: 'hourly' as ChangeFrequency,
      priority: 0.85,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/this-weekend`,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.85,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/this-week`,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/this-month`,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.75,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/free`,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/live-music`,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.85,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/live-music/tonight`,
      changeFrequency: 'hourly' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/events/map`,
      changeFrequency: 'hourly' as ChangeFrequency,
      priority: 0.85,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/saved`,
      changeFrequency: 'monthly' as ChangeFrequency,
      priority: 0.4,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/neighborhoods`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/restaurants`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.85,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/restaurants/date-night`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/restaurants/brunch`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/happy-hour`,
      changeFrequency: 'daily' as ChangeFrequency,
      priority: 0.85,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/happy-hour/today`,
      changeFrequency: 'hourly' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/venues`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/things-to-do`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.85,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/things-to-do/free`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/subscribe`,
      changeFrequency: 'monthly' as ChangeFrequency,
      priority: 0.6,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: 'monthly' as ChangeFrequency,
      priority: 0.5,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/submit-event`,
      changeFrequency: 'monthly' as ChangeFrequency,
      priority: 0.6,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/planner`,
      changeFrequency: 'monthly' as ChangeFrequency,
      priority: 0.7,
      lastModified: new Date(),
    },
  ];

  // ── Dynamic pages — run all queries in parallel for speed ─────────────────
  const [
    eventsResult,
    postsResult,
    categoriesResult,
    neighborhoodsResult,
    restaurantsResult,
    attractionsResult,
    attractionCategoriesResult,
    venuesResult,
  ] = await Promise.allSettled([
    supabase
      .from('events')
      .select('slug, updated_at')
      .eq('status', 'active')
      .order('start_date', { ascending: true }),
    supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('categories')
      .select('slug')
      .eq('is_active', true),
    supabase
      .from('neighborhoods')
      .select('slug')
      .eq('is_active', true),
    supabase
      .from('restaurants')
      .select('slug, updated_at')
      .eq('status', 'active'),
    supabase
      .from('attractions')
      .select('slug, updated_at')
      .eq('status', 'active'),
    supabase
      .from('attraction_categories')
      .select('slug'),
    supabase
      .from('venues')
      .select('slug, updated_at')
      .eq('status', 'active'),
  ]);

  // Helper: extract data from settled result, return [] on failure
  const extract = <T>(result: PromiseSettledResult<{ data: T[] | null }>): T[] => {
    if (result.status === 'fulfilled' && result.value?.data) {
      return result.value.data;
    }
    return [];
  };

  const events = extract(eventsResult);
  const posts = extract(postsResult);
  const categories = extract(categoriesResult);
  const neighborhoods = extract(neighborhoodsResult);
  const restaurants = extract(restaurantsResult);
  const attractions = extract(attractionsResult);
  const attractionCategories = extract(attractionCategoriesResult);
  const venues = extract(venuesResult);

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${BASE_URL}/events/${event.slug}`,
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.7,
    lastModified: new Date(event.updated_at),
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    changeFrequency: 'monthly' as ChangeFrequency,
    priority: 0.6,
    lastModified: new Date(post.updated_at),
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/events/category/${cat.slug}`,
    changeFrequency: 'daily' as ChangeFrequency,
    priority: 0.75,
    lastModified: new Date(),
  }));

  const neighborhoodPages: MetadataRoute.Sitemap = neighborhoods.map((n) => ({
    url: `${BASE_URL}/neighborhoods/${n.slug}`,
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.65,
    lastModified: new Date(),
  }));

  const restaurantPages: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${BASE_URL}/restaurants/${r.slug}`,
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.7,
    lastModified: new Date(r.updated_at),
  }));

  const attractionPages: MetadataRoute.Sitemap = attractions.map((a) => ({
    url: `${BASE_URL}/things-to-do/${a.slug}`,
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.7,
    lastModified: new Date(a.updated_at),
  }));

  const attractionCategoryPages: MetadataRoute.Sitemap = attractionCategories.map(
    (cat) => ({
      url: `${BASE_URL}/things-to-do/category/${cat.slug}`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.75,
      lastModified: new Date(),
    })
  );

  const venuePages: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${BASE_URL}/venues/${v.slug}`,
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.7,
    lastModified: new Date(v.updated_at),
  }));

  return [
    ...staticPages,
    ...eventPages,
    ...blogPages,
    ...categoryPages,
    ...neighborhoodPages,
    ...restaurantPages,
    ...attractionPages,
    ...attractionCategoryPages,
    ...venuePages,
  ];
}
