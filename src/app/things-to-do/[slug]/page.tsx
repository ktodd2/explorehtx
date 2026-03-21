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
  Gift,
  ChevronLeft,
  ExternalLink,
  Users,
  Accessibility,
  Timer,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AttractionJsonLd from '@/components/attractions/AttractionJsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Attraction, AttractionCategory } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchAttraction(slug: string): Promise<{
  attraction: Attraction;
  category: AttractionCategory | null;
} | null> {
  const supabase = await createClient();

  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !attraction) {
    return null;
  }

  // Fetch category if exists
  let category: AttractionCategory | null = null;
  if (attraction.category_id) {
    const { data: catData } = await supabase
      .from('attraction_categories')
      .select('*')
      .eq('id', attraction.category_id)
      .single();
    category = catData as AttractionCategory | null;
  }

  return {
    attraction: attraction as Attraction,
    category,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchAttraction(slug);

  if (!result) {
    return { title: 'Attraction Not Found' };
  }

  const { attraction, category } = result;
  const title = `${attraction.name} | Houston ${category?.name ?? 'Attraction'}`;
  const description =
    attraction.description ??
    attraction.short_description ??
    `Discover ${attraction.name} in ${attraction.neighborhood ?? 'Houston'}. ${category?.name ?? 'Things to do'} in Houston.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://explorehtx.us.com/things-to-do/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://explorehtx.us.com/things-to-do/${slug}`,
      type: 'website',
      images: attraction.image_url ? [attraction.image_url] : undefined,
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

const CATEGORY_GRADIENTS: Record<string, string> = {
  'museums-culture': 'from-purple-600 to-purple-900',
  'parks-nature': 'from-emerald-600 to-emerald-900',
  'free-activities': 'from-amber-500 to-amber-800',
  'neighborhoods': 'from-blue-600 to-blue-900',
  'family-fun': 'from-pink-500 to-pink-800',
  'outdoor-adventures': 'from-teal-600 to-teal-900',
  'local-experiences': 'from-orange-500 to-orange-800',
  'sports-recreation': 'from-red-600 to-red-900',
};

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''}${period}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
}

const PRICE_TYPE_CONFIG: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  free: { label: 'Free Admission', className: 'bg-emerald-500 text-white', icon: Gift },
  paid: { label: 'Paid Admission', className: 'bg-space-blue-900 text-white', icon: DollarSign },
  donation: { label: 'Suggested Donation', className: 'bg-amber-500 text-white', icon: Gift },
  varies: { label: 'Pricing Varies', className: 'bg-gray-700 text-white', icon: DollarSign },
};

export default async function AttractionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await fetchAttraction(slug);

  if (!result) {
    notFound();
  }

  const { attraction, category } = result;
  const gradient = category?.slug && CATEGORY_GRADIENTS[category.slug]
    ? CATEGORY_GRADIENTS[category.slug]
    : 'from-space-blue-600 to-space-blue-900';
  const priceConfig = PRICE_TYPE_CONFIG[attraction.price_type] || PRICE_TYPE_CONFIG.varies;
  const PriceIcon = priceConfig.icon;

  return (
    <>
      <AttractionJsonLd attraction={attraction} category={category} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Things To Do', href: '/things-to-do' },
          ...(category
            ? [{ name: category.name, href: `/things-to-do/category/${category.slug}` }]
            : []),
          { name: attraction.name, href: `/things-to-do/${slug}` },
        ]}
      />

      {/* Hero section */}
      <section className="relative">
        {/* Background image or gradient */}
        <div className="absolute inset-0 h-80 sm:h-96 overflow-hidden">
          {attraction.image_url ? (
            <Image
              src={attraction.image_url}
              alt={attraction.image_alt ?? attraction.name}
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
            href="/things-to-do"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            All Things To Do
          </Link>

          <div className="mt-32 sm:mt-44">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {category && (
                <Link
                  href={`/things-to-do/category/${category.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-white/20 transition-colors"
                >
                  {category.name}
                </Link>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${priceConfig.className}`}>
                <PriceIcon className="w-3.5 h-3.5" />
                {priceConfig.label}
              </span>
              {attraction.neighborhood && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  {attraction.neighborhood}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {attraction.name}
            </h1>

            {/* Short description */}
            {attraction.short_description && (
              <p className="mt-4 text-white/80 text-lg max-w-2xl">
                {attraction.short_description}
              </p>
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
            {attraction.description && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {attraction.description}
                </p>
              </section>
            )}

            {/* Best For */}
            {attraction.best_for.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-sunset-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Best For</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attraction.best_for.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 bg-sunset-orange-50 text-sunset-orange-700 text-sm font-medium rounded-lg capitalize"
                    >
                      {item.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Features */}
            {attraction.features.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Features & Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {attraction.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg capitalize"
                    >
                      {feature.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Accessibility */}
            {attraction.accessibility.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Accessibility className="w-5 h-5 text-space-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Accessibility</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attraction.accessibility.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 bg-space-blue-50 text-space-blue-700 text-sm font-medium rounded-lg capitalize"
                    >
                      {item.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {attraction.tags.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {attraction.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Visit CTA */}
            {attraction.website_url && (
              <div className="bg-sunset-orange-500 rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-lg font-bold mb-2">Plan Your Visit</h2>
                <p className="text-white/80 text-sm mb-4">
                  Get tickets, hours, and more info
                </p>
                <a
                  href={attraction.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white text-sunset-orange-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Visit Website
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
                  <PriceIcon className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {priceConfig.label}
                    </div>
                    {attraction.price_range && (
                      <div className="text-sm text-gray-500">
                        {attraction.price_range}
                      </div>
                    )}
                    {attraction.price_notes && (
                      <div className="text-sm text-gray-500 mt-1">
                        {attraction.price_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration */}
                {attraction.duration_minutes && (
                  <div className="flex items-start gap-3">
                    <Timer className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Typical Visit</div>
                      <div className="text-sm text-gray-500">
                        {formatDuration(attraction.duration_minutes)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Address */}
                {attraction.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Address</div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          attraction.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-space-blue-600 hover:text-space-blue-700 transition-colors"
                      >
                        {attraction.address}
                      </a>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {attraction.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Phone</div>
                      <a
                        href={`tel:${attraction.phone}`}
                        className="text-sm text-space-blue-600 hover:text-space-blue-700 transition-colors"
                      >
                        {attraction.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {attraction.website_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-sunset-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Website</div>
                      <a
                        href={attraction.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-space-blue-600 hover:text-space-blue-700 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hours */}
            {Object.keys(attraction.hours).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-sunset-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Hours</h2>
                </div>
                <div className="space-y-2">
                  {DAY_ORDER.map((day) => {
                    const hours = attraction.hours[day];
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
                {attraction.seasonal_notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{attraction.seasonal_notes}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Back to category */}
            {category && (
              <Link
                href={`/things-to-do/category/${category.slug}`}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                More {category.name}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
