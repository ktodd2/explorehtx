import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventGrid from '@/components/events/EventGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { categoryDisplayName } from '@/lib/utils/format';
import type { Event } from '@/types/database';

interface PageProps {
  params: Promise<{ category: string }>;
}

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  'music-concerts': {
    title: 'Houston Music & Concerts Events',
    description:
      'Find the best live music and concerts happening in Houston. From local bands to national tours — discover shows in the Bayou City.',
  },
  'sports': {
    title: 'Houston Sports Events & Games',
    description:
      'Astros, Rockets, Texans and more. Follow Houston sports events, games, and fan experiences all year round.',
  },
  'food-dining': {
    title: 'Houston Food & Dining Events',
    description:
      'Food festivals, restaurant week, pop-ups, and culinary events in Houston. Experience the best of H-Town dining.',
  },
  'arts-culture': {
    title: 'Houston Arts & Culture Events',
    description:
      'Gallery openings, museum events, cultural festivals, and more. Explore Houston\'s vibrant arts scene.',
  },
  'nightlife': {
    title: 'Houston Nightlife Events',
    description:
      'Bars, clubs, DJ nights, and after-dark events in Houston. Discover the city\'s best nightlife every weekend.',
  },
  'family-kids': {
    title: 'Houston Family & Kids Events',
    description:
      'Kid-friendly events, family outings, and activities for children of all ages in Houston, TX.',
  },
  'outdoor-parks': {
    title: 'Houston Outdoor & Parks Events',
    description:
      'Hikes, park events, outdoor festivals, and nature activities in and around Houston.',
  },
  'festivals': {
    title: 'Houston Festivals & Fairs',
    description:
      'The biggest Houston festivals, fairs, and large outdoor events. Don\'t miss a single celebration in H-Town.',
  },
  'comedy': {
    title: 'Houston Comedy Shows & Events',
    description:
      'Stand-up, improv, open mics, and comedy nights happening in Houston. Laugh it up in the Bayou City.',
  },
  'theater': {
    title: 'Houston Theater & Live Performance Events',
    description:
      'Broadway shows, local theater, dance performances, and live entertainment events in Houston.',
  },
  'markets-shopping': {
    title: 'Houston Markets & Shopping Events',
    description:
      'Farmers markets, artisan fairs, flea markets, and pop-up shops in Houston, TX.',
  },
  'free-events': {
    title: 'Free Events in Houston',
    description:
      'The best free things to do in Houston — events, activities, and experiences that won\'t cost you a dime.',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const seo = CATEGORY_SEO[category];
  const displayName = categoryDisplayName(category);

  const title = seo?.title ?? `Houston ${displayName} Events`;
  const description =
    seo?.description ??
    `Browse ${displayName} events in Houston, TX. Updated daily on ExploreHTX.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://explorehtx.us.com/events/category/${category}`,
    },
    openGraph: {
      title: `${title} | ExploreHTX`,
      description,
      url: `https://explorehtx.us.com/events/category/${category}`,
      type: 'website',
    },
  };
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'music-concerts': 'from-purple-600 to-purple-900',
  'sports': 'from-green-600 to-green-900',
  'food-dining': 'from-amber-500 to-amber-800',
  'arts-culture': 'from-pink-500 to-pink-900',
  'nightlife': 'from-indigo-600 to-indigo-900',
  'family-kids': 'from-cyan-500 to-cyan-800',
  'outdoor-parks': 'from-emerald-500 to-emerald-900',
  'festivals': 'from-rose-500 to-rose-800',
  'comedy': 'from-yellow-500 to-amber-700',
  'theater': 'from-fuchsia-500 to-fuchsia-900',
  'markets-shopping': 'from-orange-400 to-orange-700',
};

const KNOWN_CATEGORIES = new Set([
  'music-concerts', 'sports', 'food-dining', 'arts-culture', 'nightlife',
  'family-kids', 'outdoor-parks', 'festivals', 'free-events', 'comedy',
  'theater', 'markets-shopping', 'community', 'wellness', 'film',
  'education', 'business', 'charity',
]);

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  // 404 for completely unknown slugs (not in known list and not in DB)
  const supabase = await createClient();

  const { count } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('category', category)
    .eq('status', 'active');

  if (!KNOWN_CATEGORIES.has(category) && (count === 0 || count === null)) {
    notFound();
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString())
    .order('featured', { ascending: false })
    .order('start_date', { ascending: true })
    .limit(48);

  const displayName = categoryDisplayName(category);
  const gradient =
    CATEGORY_GRADIENTS[category] ?? 'from-space-blue-600 to-space-blue-900';
  const seo = CATEGORY_SEO[category];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Events', href: '/events' },
          { name: displayName, href: `/events/category/${category}` },
        ]}
      />

      {/* Hero */}
      <section
        className={`relative bg-gradient-to-br ${gradient} py-14 sm:py-20 overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('/images/houston-pattern.svg')]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/events" className="hover:text-white transition-colors">
              Events
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{displayName}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
              <Tag className="w-3.5 h-3.5" />
              Category
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            {seo?.title ?? `${displayName} Events in Houston`}
          </h1>
          {seo?.description && (
            <p className="mt-4 text-white/80 text-lg max-w-2xl leading-relaxed">
              {seo.description}
            </p>
          )}

          <p className="mt-3 text-white/60 text-sm">
            {count ?? 0} upcoming {count === 1 ? 'event' : 'events'}
          </p>
        </div>
      </section>

      {/* Events grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <EventGrid
          events={(events as Event[]) ?? []}
          emptyMessage={`No upcoming ${displayName} events right now. Check back soon!`}
        />

        {(count ?? 0) > 48 && (
          <p className="mt-8 text-center text-sm text-gray-400">
            Showing 48 of {count} events.{' '}
            <Link
              href={`/events?category=${category}`}
              className="text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
            >
              Browse all with filters
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
