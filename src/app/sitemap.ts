import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://explorehtx.us.com';

type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

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
  ];

  // ── Dynamic: active events ─────────────────────────────────────────────────
  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('status', 'active')
    .order('start_date', { ascending: true });

  const eventPages: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
    url: `${BASE_URL}/events/${event.slug}`,
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.7,
    lastModified: new Date(event.updated_at),
  }));

  // ── Dynamic: published blog posts ─────────────────────────────────────────
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    changeFrequency: 'monthly' as ChangeFrequency,
    priority: 0.6,
    lastModified: new Date(post.updated_at),
  }));

  // ── Dynamic: active categories ────────────────────────────────────────────
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true);

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
    url: `${BASE_URL}/events/category/${cat.slug}`,
    changeFrequency: 'daily' as ChangeFrequency,
    priority: 0.75,
    lastModified: new Date(),
  }));

  // ── Dynamic: active neighborhoods ─────────────────────────────────────────
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('slug')
    .eq('is_active', true);

  const neighborhoodPages: MetadataRoute.Sitemap = (neighborhoods ?? []).map(
    (n) => ({
      url: `${BASE_URL}/neighborhoods/${n.slug}`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.65,
      lastModified: new Date(),
    })
  );

  // ── Dynamic: active restaurants ─────────────────────────────────────────
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('slug, updated_at')
    .eq('status', 'active');

  const restaurantPages: MetadataRoute.Sitemap = (restaurants ?? []).map(
    (r) => ({
      url: `${BASE_URL}/restaurants/${r.slug}`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.7,
      lastModified: new Date(r.updated_at),
    })
  );

  // ── Dynamic: active attractions ─────────────────────────────────────────
  const { data: attractions } = await supabase
    .from('attractions')
    .select('slug, updated_at')
    .eq('status', 'active');

  const attractionPages: MetadataRoute.Sitemap = (attractions ?? []).map(
    (a) => ({
      url: `${BASE_URL}/things-to-do/${a.slug}`,
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.7,
      lastModified: new Date(a.updated_at),
    })
  );

  // ── Dynamic: attraction categories ───────────────────────────────────────
  const { data: attractionCategories } = await supabase
    .from('attraction_categories')
    .select('slug');

  const attractionCategoryPages: MetadataRoute.Sitemap = (
    attractionCategories ?? []
  ).map((cat) => ({
    url: `${BASE_URL}/things-to-do/category/${cat.slug}`,
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.75,
    lastModified: new Date(),
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
  ];
}
