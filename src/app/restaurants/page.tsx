import type { Metadata } from 'next';
import Link from 'next/link';
import { Utensils, Heart, HelpCircle, Coffee } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RestaurantGrid from '@/components/restaurants/RestaurantGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import type { Restaurant } from '@/types/database';

export const metadata: Metadata = {
  title: 'Houston Restaurants & Date Night Spots',
  description:
    'Discover the best Houston restaurants for date night, special occasions, and unforgettable dining experiences. Curated by cuisine type with reservation links.',
  alternates: {
    canonical: 'https://explorehtx.us.com/restaurants',
  },
  openGraph: {
    title: 'Houston Restaurants & Date Night Spots | ExploreHTX',
    description:
      'Discover the best Houston restaurants for date night and special occasions.',
    url: 'https://explorehtx.us.com/restaurants',
    type: 'website',
  },
};

const RESTAURANT_FAQ = [
  {
    question: 'What are the best date night restaurants in Houston?',
    answer:
      'Houston offers exceptional date night options including romantic Italian bistros, upscale steakhouses, intimate French restaurants, and rooftop dining with skyline views. Check our Date Night Guide for curated romantic restaurant recommendations organized by cuisine and occasion.',
  },
  {
    question: 'Where are the best restaurants in Houston?',
    answer:
      'Houston is one of America\'s best food cities with world-class dining across every cuisine. Top neighborhoods for restaurants include Montrose, the Heights, Rice Village, Downtown, and the Museum District. Our restaurant guide features curated picks from local food experts.',
  },
];

interface RestaurantsByCuisine {
  cuisineType: string;
  restaurants: Restaurant[];
}

async function fetchRestaurantsByCuisine(): Promise<RestaurantsByCuisine[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('status', 'active')
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants:', error.message);
    return [];
  }

  const restaurants = (data as Restaurant[]) ?? [];

  // Group by cuisine type
  const grouped = restaurants.reduce<Record<string, Restaurant[]>>(
    (acc, restaurant) => {
      const type = restaurant.cuisine_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(restaurant);
      return acc;
    },
    {}
  );

  // Sort cuisine types by total restaurant count (most first)
  return Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([cuisineType, restaurants]) => ({ cuisineType, restaurants }));
}

async function fetchFeaturedRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .order('popularity_score', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured restaurants:', error.message);
    return [];
  }

  return (data as Restaurant[]) ?? [];
}

export default async function RestaurantsPage() {
  const [cuisineGroups, featuredRestaurants] = await Promise.all([
    fetchRestaurantsByCuisine(),
    fetchFeaturedRestaurants(),
  ]);

  const totalRestaurants = cuisineGroups.reduce(
    (sum, group) => sum + group.restaurants.length,
    0
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Restaurants', href: '/restaurants' },
        ]}
      />
      <FAQJsonLd items={RESTAURANT_FAQ} />

      {/* Page header */}
      <section className="bg-space-blue-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sunset-orange-400 text-sm font-medium mb-3">
              <Utensils className="w-4 h-4" />
              Houston Restaurants
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Houston&apos;s Best Restaurants
            </h1>
            <p className="mt-4 text-space-blue-200 text-lg leading-relaxed">
              Curated date night spots and dining experiences across Houston.
              From romantic bistros to special occasion steakhouses.
            </p>
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/restaurants/date-night"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-400 text-white font-semibold text-sm rounded-xl transition-colors shadow-md"
            >
              <Heart className="w-4 h-4" />
              Date Night Guide
            </Link>
            <Link
              href="/restaurants/brunch"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm rounded-xl transition-colors shadow-md"
            >
              <Coffee className="w-4 h-4" />
              Brunch Spots
            </Link>
            {cuisineGroups.slice(0, 3).map(({ cuisineType }) => (
              <a
                key={cuisineType}
                href={`#${cuisineType.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2.5 bg-space-blue-700 hover:bg-space-blue-600 text-white font-medium text-sm rounded-xl transition-colors"
              >
                {cuisineType}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured section */}
        {featuredRestaurants.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Restaurants
              </h2>
              <span className="text-sm text-gray-500">
                {totalRestaurants} restaurants total
              </span>
            </div>
            <RestaurantGrid restaurants={featuredRestaurants} />
          </section>
        )}

        {/* Cuisine sections */}
        {cuisineGroups.map(({ cuisineType, restaurants }) => (
          <section
            key={cuisineType}
            id={cuisineType.toLowerCase().replace(/\s+/g, '-')}
            className="mb-16 scroll-mt-24"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{cuisineType}</h2>
              <span className="text-sm text-gray-500">
                {restaurants.length} {restaurants.length === 1 ? 'spot' : 'spots'}
              </span>
            </div>
            <RestaurantGrid restaurants={restaurants} />
          </section>
        ))}

        {/* Empty state */}
        {cuisineGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Utensils className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No restaurants yet
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              We&apos;re curating Houston&apos;s best dining spots. Check back
              soon for restaurant recommendations!
            </p>
          </div>
        )}

        {/* FAQ Section */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-sunset-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {RESTAURANT_FAQ.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
