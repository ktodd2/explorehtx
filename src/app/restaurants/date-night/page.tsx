import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RestaurantGrid from '@/components/restaurants/RestaurantGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Restaurant } from '@/types/database';

export const metadata: Metadata = {
  title: 'Date Night Restaurants in Houston | Best Romantic Dining Spots',
  description:
    'Find the perfect Houston restaurant for your date night. From first dates to anniversary celebrations, discover romantic dining spots curated by occasion.',
  alternates: {
    canonical: 'https://explorehtx.us.com/restaurants/date-night',
  },
  openGraph: {
    title: 'Date Night Restaurants in Houston | ExploreHTX',
    description:
      'Find the perfect Houston restaurant for your date night.',
    url: 'https://explorehtx.us.com/restaurants/date-night',
    type: 'website',
  },
};

interface RestaurantsByLabel {
  label: string;
  description: string;
  restaurants: Restaurant[];
}

// Define the date night label order and descriptions
const DATE_NIGHT_LABELS = [
  {
    label: 'Anniversary Worthy',
    description: 'Exceptional dining experiences perfect for celebrating milestones and special moments.',
  },
  {
    label: 'Special Occasion',
    description: 'Impressive restaurants for birthdays, promotions, or any celebration worth remembering.',
  },
  {
    label: 'Perfect for First Dates',
    description: 'Approachable spots with great ambiance that make conversation easy.',
  },
  {
    label: 'Casual Date Night',
    description: 'Relaxed, no-fuss restaurants for when you want great food without the formality.',
  },
  {
    label: 'Impressive Date',
    description: 'Restaurants that show you have great taste and know the Houston dining scene.',
  },
  {
    label: 'Late Night Romance',
    description: 'Hip spots with late hours, perfect for dates that start after 9 PM.',
  },
  {
    label: 'Impressive but Affordable',
    description: 'Great food and ambiance without breaking the bank.',
  },
  {
    label: 'Foodie Date',
    description: 'For couples who bond over discovering exceptional cuisine and creative dishes.',
  },
];

async function fetchDateNightRestaurants(): Promise<RestaurantsByLabel[]> {
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

  // Group by date night labels
  const grouped: RestaurantsByLabel[] = [];

  for (const { label, description } of DATE_NIGHT_LABELS) {
    const matching = restaurants.filter((r) =>
      r.date_night_labels.includes(label)
    );
    if (matching.length > 0) {
      grouped.push({ label, description, restaurants: matching });
    }
  }

  return grouped;
}

export default async function DateNightPage() {
  const labelGroups = await fetchDateNightRestaurants();

  const totalRestaurants = new Set(
    labelGroups.flatMap((g) => g.restaurants.map((r) => r.id))
  ).size;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Restaurants', href: '/restaurants' },
          { name: 'Date Night', href: '/restaurants/date-night' },
        ]}
      />

      {/* Page header */}
      <section className="bg-gradient-to-br from-rose-600 to-sunset-orange-600 py-12 sm:py-16">
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
              <Heart className="w-4 h-4" />
              Date Night Guide
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Houston Date Night Restaurants
            </h1>
            <p className="mt-4 text-white/90 text-lg leading-relaxed">
              From first dates to anniversary celebrations, find the perfect
              restaurant for your next romantic outing. {totalRestaurants} curated
              spots organized by occasion.
            </p>
          </div>

          {/* Quick jump links */}
          <div className="mt-8 flex flex-wrap gap-2">
            {labelGroups.slice(0, 4).map(({ label }) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-xl transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Label sections */}
        {labelGroups.map(({ label, description, restaurants }) => (
          <section
            key={label}
            id={label.toLowerCase().replace(/\s+/g, '-')}
            className="mb-16 scroll-mt-24"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-sunset-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
              </div>
              <p className="text-gray-600 max-w-2xl">{description}</p>
            </div>
            <RestaurantGrid restaurants={restaurants} />
          </section>
        ))}

        {/* Empty state */}
        {labelGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No date night spots yet
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              We&apos;re curating Houston&apos;s best romantic dining spots.
              Check back soon!
            </p>
          </div>
        )}

        {/* Tips section */}
        {labelGroups.length > 0 && (
          <section className="bg-space-blue-50 rounded-2xl p-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Date Night Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Make a Reservation
                </h3>
                <p className="text-gray-600 text-sm">
                  Houston&apos;s best spots fill up fast, especially on weekends.
                  Book at least a few days ahead, or a week for special occasions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Check the Dress Code
                </h3>
                <p className="text-gray-600 text-sm">
                  Higher-end spots often expect smart casual or business casual.
                  Check the restaurant page for details to avoid surprises.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Explore the Neighborhood
                </h3>
                <p className="text-gray-600 text-sm">
                  Plan to arrive early and walk the neighborhood. Montrose, The
                  Heights, and EaDo all have great spots for pre-dinner drinks.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Pair with an Event
                </h3>
                <p className="text-gray-600 text-sm">
                  Check our{' '}
                  <Link
                    href="/events"
                    className="text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
                  >
                    Events page
                  </Link>{' '}
                  for concerts, shows, or outdoor activities to complete your
                  date night.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
