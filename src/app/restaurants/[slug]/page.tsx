import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  DollarSign,
  Utensils,
  Heart,
  ExternalLink,
  ChevronLeft,
  Volume2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import RestaurantJsonLd from '@/components/restaurants/RestaurantJsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import type { Restaurant } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchRestaurant(slug: string): Promise<Restaurant | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return data as Restaurant;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurant(slug);

  if (!restaurant) {
    return { title: 'Restaurant Not Found' };
  }

  const title = `${restaurant.name} | Houston ${restaurant.cuisine_type} Restaurant`;
  const description =
    restaurant.description ??
    `${restaurant.name} in ${restaurant.neighborhood ?? 'Houston'}. ${restaurant.cuisine_type} cuisine. ${restaurant.price_range} pricing.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://explorehtx.us.com/restaurants/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://explorehtx.us.com/restaurants/${slug}`,
      type: 'website',
      images: restaurant.image_url ? [restaurant.image_url] : undefined,
    },
  };
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''}${period}`;
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await fetchRestaurant(slug);

  if (!restaurant) {
    notFound();
  }

  const gradient =
    restaurant.cuisine_type === 'Steakhouse'
      ? 'from-red-700 to-red-950'
      : restaurant.cuisine_type === 'Japanese'
      ? 'from-rose-500 to-rose-800'
      : restaurant.cuisine_type === 'Mexican'
      ? 'from-amber-500 to-amber-800'
      : restaurant.cuisine_type === 'Italian'
      ? 'from-green-600 to-green-900'
      : 'from-space-blue-600 to-space-blue-900';

  return (
    <>
      <RestaurantJsonLd restaurant={restaurant} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Restaurants', href: '/restaurants' },
          { name: restaurant.name, href: `/restaurants/${slug}` },
        ]}
      />

      {/* Hero section */}
      <section className="relative">
        {/* Background image or gradient */}
        <div className="absolute inset-0 h-80 sm:h-96 overflow-hidden">
          {restaurant.image_url ? (
            <Image
              src={restaurant.image_url}
              alt={restaurant.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-space-blue-900 via-space-blue-900/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16">
          {/* Back link */}
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            All Restaurants
          </Link>

          <div className="mt-32 sm:mt-44">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                <Utensils className="w-3.5 h-3.5" />
                {restaurant.cuisine_type}
              </span>
              <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                {restaurant.price_range}
              </span>
              {restaurant.neighborhood && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  {restaurant.neighborhood}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {restaurant.name}
            </h1>

            {/* Date night labels */}
            {restaurant.date_night_labels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {restaurant.date_night_labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sunset-orange-500/90 text-white text-sm font-semibold rounded-full"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {restaurant.description && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">
                  {restaurant.description}
                </p>
              </section>
            )}

            {/* Signature Dishes */}
            {restaurant.signature_dishes.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Signature Dishes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {restaurant.signature_dishes.map((dish) => (
                    <span
                      key={dish}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg"
                    >
                      {dish}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Menu Highlights */}
            {Object.keys(restaurant.menu_highlights).length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Menu Highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Object.entries(restaurant.menu_highlights).map(
                    ([category, items]) =>
                      items &&
                      items.length > 0 && (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {category.replace(/-/g, ' ')}
                          </h3>
                          <ul className="space-y-1">
                            {items.map((item: string) => (
                              <li
                                key={item}
                                className="text-gray-700 text-sm"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                  )}
                </div>
              </section>
            )}

            {/* Ambiance & Features */}
            {(restaurant.ambiance.length > 0 ||
              restaurant.features.length > 0) && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Vibe & Features
                </h2>
                <div className="space-y-4">
                  {restaurant.ambiance.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Ambiance
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.ambiance.map((item) => (
                          <span
                            key={item}
                            className="px-3 py-1.5 bg-space-blue-50 text-space-blue-700 text-sm font-medium rounded-lg capitalize"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {restaurant.features.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Features
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.features.map((item) => (
                          <span
                            key={item}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg capitalize"
                          >
                            {item.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 pt-2">
                    {restaurant.dress_code && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Dress:</span>
                        <span className="capitalize">{restaurant.dress_code}</span>
                      </div>
                    )}
                    {restaurant.noise_level && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{restaurant.noise_level}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reservation CTA */}
            {restaurant.reservation_url && (
              <div className="bg-sunset-orange-500 rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-lg font-bold mb-2">Make a Reservation</h2>
                <p className="text-white/80 text-sm mb-4">
                  Book a table at {restaurant.name}
                </p>
                <a
                  href={restaurant.reservation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white text-sunset-orange-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Reserve Now
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Quick Info
              </h2>
              <div className="space-y-4">
                {/* Price */}
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {restaurant.price_range}
                    </div>
                    {restaurant.avg_price_per_person && (
                      <div className="text-sm text-gray-500">
                        ~${restaurant.avg_price_per_person}/person
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                {restaurant.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Address</div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          restaurant.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-space-blue-600 hover:text-space-blue-700 transition-colors"
                      >
                        {restaurant.address}
                      </a>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {restaurant.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Phone</div>
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="text-sm text-space-blue-600 hover:text-space-blue-700 transition-colors"
                      >
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {restaurant.website_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Website</div>
                      <a
                        href={restaurant.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-space-blue-600 hover:text-space-blue-700 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}

                {/* Menu */}
                {restaurant.menu_url && (
                  <a
                    href={restaurant.menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-100 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-200 transition-colors mt-4"
                  >
                    View Full Menu
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Hours */}
            {Object.keys(restaurant.hours).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-sunset-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Hours</h2>
                </div>
                <div className="space-y-2">
                  {DAY_ORDER.map((day) => {
                    const hours = restaurant.hours[day];
                    return (
                      <div
                        key={day}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600 font-medium">
                          {DAY_LABELS[day]}
                        </span>
                        {hours ? (
                          <span className="text-gray-900">
                            {formatTime(hours.open)} – {formatTime(hours.close)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection
          entityType="restaurant"
          entityId={restaurant.id}
          entityName={restaurant.name}
        />
      </div>
    </>
  );
}
