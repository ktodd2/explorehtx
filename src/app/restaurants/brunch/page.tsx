import type { Metadata } from 'next';
import Link from 'next/link';
import { Coffee, ArrowLeft, Sun, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RestaurantGrid from '@/components/restaurants/RestaurantGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import type { Restaurant } from '@/types/database';

export const metadata: Metadata = {
  title: 'Best Brunch Spots in Houston | Weekend Brunch Restaurants',
  description:
    'Find the best brunch spots in Houston for your weekend mornings. Bottomless mimosas, creative eggs benedict, and Instagram-worthy breakfast spots.',
  alternates: {
    canonical: 'https://explorehtx.us.com/restaurants/brunch',
  },
  openGraph: {
    title: 'Best Brunch Spots in Houston | ExploreHTX',
    description: 'Find the best brunch spots in Houston for your weekend mornings.',
    url: 'https://explorehtx.us.com/restaurants/brunch',
    type: 'website',
  },
};

const BRUNCH_FAQ = [
  {
    question: 'What are the best brunch spots in Houston?',
    answer:
      'Houston has an incredible brunch scene ranging from classic American breakfast spots to creative fusion brunch menus. Top neighborhoods for brunch include Montrose, The Heights, Midtown, and River Oaks. Many spots offer bottomless mimosas and bloody marys on weekends.',
  },
  {
    question: 'What time does brunch typically start in Houston?',
    answer:
      'Most Houston brunch spots open between 9 AM and 11 AM on weekends. Popular spots fill up quickly, so arriving early or making a reservation is recommended. Some places offer brunch until 3 PM or later.',
  },
  {
    question: 'Do Houston brunch spots take reservations?',
    answer:
      'Many popular brunch spots accept reservations through OpenTable, Resy, or their own booking systems. For trending spots, weekend reservations should be made a few days in advance. Walk-ins are possible but may involve a wait.',
  },
];

// Brunch-related keywords to match in features, best_for, or cuisine_tags
const BRUNCH_KEYWORDS = [
  'brunch',
  'breakfast',
  'weekend brunch',
  'bottomless brunch',
  'mimosas',
  'eggs benedict',
  'pancakes',
  'morning',
];

interface BrunchCategory {
  label: string;
  description: string;
  filter: (r: Restaurant) => boolean;
}

const BRUNCH_CATEGORIES: BrunchCategory[] = [
  {
    label: 'Bottomless Brunch',
    description: 'Unlimited mimosas, bloody marys, and brunch cocktails.',
    filter: (r) =>
      r.features.some((f) => f.toLowerCase().includes('bottomless')) ||
      r.features.some((f) => f.toLowerCase().includes('mimosa')),
  },
  {
    label: 'Classic Brunch',
    description: 'Traditional breakfast and brunch fare done right.',
    filter: (r) =>
      r.best_for.some((b) => b.toLowerCase().includes('brunch')) ||
      r.features.some((f) => f.toLowerCase().includes('brunch')),
  },
  {
    label: 'Boozy Brunch',
    description: 'Great cocktails to pair with your morning meal.',
    filter: (r) =>
      r.features.some((f) => f.toLowerCase().includes('cocktail')) ||
      r.features.some((f) => f.toLowerCase().includes('bar')),
  },
  {
    label: 'Patio Brunch',
    description: 'Enjoy your brunch outdoors with Houston weather.',
    filter: (r) =>
      r.features.some((f) => f.toLowerCase().includes('patio')) ||
      r.features.some((f) => f.toLowerCase().includes('outdoor')),
  },
];

function isBrunchSpot(restaurant: Restaurant): boolean {
  const allText = [
    ...restaurant.features,
    ...restaurant.best_for,
    ...restaurant.cuisine_tags,
  ]
    .join(' ')
    .toLowerCase();

  return BRUNCH_KEYWORDS.some((keyword) => allText.includes(keyword));
}

interface RestaurantsByCategory {
  label: string;
  description: string;
  restaurants: Restaurant[];
}

async function fetchBrunchRestaurants(): Promise<{
  all: Restaurant[];
  categories: RestaurantsByCategory[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('status', 'active')
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants:', error.message);
    return { all: [], categories: [] };
  }

  const restaurants = (data as Restaurant[]) ?? [];

  // Filter to brunch spots
  const brunchSpots = restaurants.filter(isBrunchSpot);

  // Group by categories
  const categories: RestaurantsByCategory[] = [];
  const usedIds = new Set<string>();

  for (const category of BRUNCH_CATEGORIES) {
    const matching = brunchSpots.filter(
      (r) => category.filter(r) && !usedIds.has(r.id)
    );
    if (matching.length > 0) {
      categories.push({
        label: category.label,
        description: category.description,
        restaurants: matching,
      });
      matching.forEach((r) => usedIds.add(r.id));
    }
  }

  // Add remaining brunch spots to a general category
  const remaining = brunchSpots.filter((r) => !usedIds.has(r.id));
  if (remaining.length > 0) {
    categories.push({
      label: 'More Brunch Spots',
      description: 'Additional great options for your weekend breakfast.',
      restaurants: remaining,
    });
  }

  return { all: brunchSpots, categories };
}

export default async function BrunchPage() {
  const { all: allBrunchSpots, categories } = await fetchBrunchRestaurants();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Restaurants', href: '/restaurants' },
          { name: 'Brunch', href: '/restaurants/brunch' },
        ]}
      />
      <FAQJsonLd items={BRUNCH_FAQ} />

      {/* Page header */}
      <section className="bg-gradient-to-br from-amber-500 to-orange-600 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Restaurants
          </Link>

          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-3">
              <Coffee className="w-4 h-4" />
              Brunch Guide
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Houston Brunch Spots
            </h1>
            <p className="mt-4 text-white/90 text-lg leading-relaxed">
              Wake up to Houston&apos;s best brunch scene. From bottomless mimosas
              to creative breakfast dishes, find your new weekend favorite.
              {allBrunchSpots.length > 0 && (
                <span className="block mt-2 text-white/70">
                  {allBrunchSpots.length} curated spots
                </span>
              )}
            </p>
          </div>

          {/* Quick info cards */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Sun className="w-5 h-5 text-white/80 mb-2" />
              <p className="text-white font-semibold">Weekend Hours</p>
              <p className="text-white/70 text-sm">Sat & Sun 9am-3pm</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Clock className="w-5 h-5 text-white/80 mb-2" />
              <p className="text-white font-semibold">Best Time</p>
              <p className="text-white/70 text-sm">10-11am to avoid wait</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 col-span-2 sm:col-span-1">
              <Coffee className="w-5 h-5 text-white/80 mb-2" />
              <p className="text-white font-semibold">Pro Tip</p>
              <p className="text-white/70 text-sm">Book 2-3 days ahead</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category sections */}
        {categories.map(({ label, description, restaurants }) => (
          <section
            key={label}
            id={label.toLowerCase().replace(/\s+/g, '-')}
            className="mb-16 scroll-mt-24"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Coffee className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
              </div>
              <p className="text-gray-600 max-w-2xl">{description}</p>
            </div>
            <RestaurantGrid restaurants={restaurants} />
          </section>
        ))}

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
              <Coffee className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No brunch spots yet
            </h2>
            <p className="text-gray-500 text-center max-w-md mb-6">
              We&apos;re curating Houston&apos;s best brunch spots. Check back soon
              for recommendations!
            </p>
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse All Restaurants
            </Link>
          </div>
        )}

        {/* FAQ Section */}
        {categories.length > 0 && (
          <section className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Houston Brunch FAQ
            </h2>
            <div className="space-y-6">
              {BRUNCH_FAQ.map((faq, index) => (
                <div key={index} className="bg-amber-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
