import type { Metadata } from 'next';
import Link from 'next/link';
import { Wine, Clock, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import type { Restaurant, HappyHour, HappyHourWithRestaurant } from '@/types/database';

export const metadata: Metadata = {
  title: 'Happy Hour in Houston | Best Drink & Food Deals',
  description:
    'Find the best happy hour deals in Houston. Discounted drinks, appetizers, and specials at top Houston bars and restaurants.',
  alternates: {
    canonical: 'https://explorehtx.us.com/happy-hour',
  },
  openGraph: {
    title: 'Happy Hour in Houston | ExploreHTX',
    description: 'Find the best happy hour deals in Houston.',
    url: 'https://explorehtx.us.com/happy-hour',
    type: 'website',
  },
};

const HAPPY_HOUR_FAQ = [
  {
    question: 'When is happy hour in Houston?',
    answer:
      'Most Houston happy hours run from 4 PM to 7 PM on weekdays, though some start as early as 3 PM. Many spots also offer reverse happy hour (late-night deals) from 9 PM to close.',
  },
  {
    question: 'What are the best happy hour deals in Houston?',
    answer:
      'Houston offers incredible happy hour deals ranging from $5 craft cocktails to half-off appetizers. Popular neighborhoods for happy hour include Downtown, Midtown, Montrose, and the Heights.',
  },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getCurrentDayIndex(): number {
  // Get Houston time
  const now = new Date();
  const houstonTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return houstonTime.getDay();
}

interface HappyHoursByDay {
  day: string;
  dayIndex: number;
  happyHours: HappyHourWithRestaurant[];
}

async function fetchHappyHours(): Promise<{
  today: HappyHourWithRestaurant[];
  byDay: HappyHoursByDay[];
  allRestaurants: Restaurant[];
}> {
  const supabase = await createClient();
  const todayIndex = getCurrentDayIndex();

  // Fetch happy hours with restaurant data
  const { data: happyHours, error } = await supabase
    .from('happy_hours')
    .select(`
      *,
      restaurant:restaurants(*)
    `)
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching happy hours:', error.message);
    // Fallback: fetch restaurants with has_happy_hour flag
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .eq('status', 'active')
      .eq('has_happy_hour', true)
      .order('popularity_score', { ascending: false });

    return {
      today: [],
      byDay: [],
      allRestaurants: (restaurants as Restaurant[]) ?? [],
    };
  }

  const allHappyHours = (happyHours as HappyHourWithRestaurant[]) ?? [];

  // Group by day
  const byDay: HappyHoursByDay[] = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    happyHours: allHappyHours.filter((hh) => hh.day_of_week === index),
  })).filter((group) => group.happyHours.length > 0);

  // Today's happy hours
  const today = allHappyHours.filter((hh) => hh.day_of_week === todayIndex);

  // All unique restaurants with happy hours
  const uniqueRestaurants = new Map<string, Restaurant>();
  allHappyHours.forEach((hh) => {
    if (hh.restaurant) {
      uniqueRestaurants.set(hh.restaurant.id, hh.restaurant);
    }
  });

  return {
    today,
    byDay,
    allRestaurants: Array.from(uniqueRestaurants.values()),
  };
}

export default async function HappyHourPage() {
  const { today, byDay, allRestaurants } = await fetchHappyHours();
  const currentDay = DAYS[getCurrentDayIndex()];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Happy Hour', href: '/happy-hour' },
        ]}
      />
      <FAQJsonLd items={HAPPY_HOUR_FAQ} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-600 to-indigo-800 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-3">
              <Wine className="w-4 h-4" />
              Houston Happy Hour Guide
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Happy Hour in Houston
            </h1>
            <p className="mt-4 text-purple-100 text-lg leading-relaxed">
              Discounted drinks, appetizer specials, and after-work deals at Houston&apos;s best bars and restaurants.
            </p>
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/happy-hour/today"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 font-semibold text-sm rounded-xl transition-colors shadow-md hover:bg-purple-50"
            >
              <Clock className="w-4 h-4" />
              {currentDay}&apos;s Happy Hours
            </Link>
            {byDay.slice(0, 3).map(({ day, dayIndex }) => (
              <a
                key={day}
                href={`#${day.toLowerCase()}`}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium text-sm rounded-xl transition-colors"
              >
                {day}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Happy Hours */}
        {today.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Happy Hour Today
                </h2>
                <p className="text-gray-500 text-sm">{currentDay}&apos;s deals</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {today.map((hh) => (
                hh.restaurant && (
                  <HappyHourCard key={hh.id} happyHour={hh} />
                )
              ))}
            </div>
          </section>
        )}

        {/* All restaurants with happy hour (fallback when no happy_hours table data) */}
        {byDay.length === 0 && allRestaurants.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Restaurants with Happy Hour
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </section>
        )}

        {/* By day sections */}
        {byDay.map(({ day, happyHours }) => (
          <section
            key={day}
            id={day.toLowerCase()}
            className="mb-16 scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900">{day}</h2>
              <span className="text-sm text-gray-500">
                {happyHours.length} {happyHours.length === 1 ? 'spot' : 'spots'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {happyHours.map((hh) => (
                hh.restaurant && (
                  <HappyHourCard key={hh.id} happyHour={hh} />
                )
              ))}
            </div>
          </section>
        ))}

        {/* Empty state */}
        {byDay.length === 0 && allRestaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
              <Wine className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-500 text-center max-w-md mb-6">
              We&apos;re gathering Houston&apos;s best happy hour deals. Check back soon!
            </p>
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Restaurants
            </Link>
          </div>
        )}

        {/* FAQ Section */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Happy Hour FAQ
          </h2>
          <div className="space-y-6">
            {HAPPY_HOUR_FAQ.map((faq, index) => (
              <div key={index} className="bg-purple-50 rounded-xl p-6">
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

// Happy Hour Card Component
function HappyHourCard({ happyHour }: { happyHour: HappyHourWithRestaurant }) {
  const { restaurant, start_time, end_time, deals, notes } = happyHour;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
            {restaurant.name}
          </h3>
          <span className="flex-shrink-0 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            {formatTime(start_time)} - {formatTime(end_time)}
          </span>
        </div>

        {restaurant.neighborhood && (
          <p className="text-sm text-gray-500 mb-3">{restaurant.neighborhood}</p>
        )}

        {/* Deals */}
        {deals && deals.length > 0 && (
          <div className="space-y-2">
            {deals.slice(0, 3).map((deal, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  deal.type === 'drink' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {deal.type === 'drink' ? '🍹' : '🍽️'}
                </span>
                <span className="text-sm text-gray-700">{deal.description}</span>
              </div>
            ))}
            {deals.length > 3 && (
              <p className="text-xs text-gray-400">+{deals.length - 3} more deals</p>
            )}
          </div>
        )}

        {notes && (
          <p className="mt-3 text-xs text-gray-400 italic">{notes}</p>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
            View Details
            <ChevronRight className="inline w-4 h-4 ml-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
