import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift, ChevronLeft, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AttractionGrid from '@/components/attractions/AttractionGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Attraction, AttractionCategory } from '@/types/database';

export const metadata: Metadata = {
  title: 'Free Things To Do in Houston | No-Cost Activities & Attractions',
  description:
    'Discover free things to do in Houston: free museums, parks, outdoor activities, and local experiences. Enjoy Houston without spending a dime.',
  alternates: {
    canonical: 'https://explorehtx.us.com/things-to-do/free',
  },
  openGraph: {
    title: 'Free Things To Do in Houston | ExploreHTX',
    description:
      'Discover free things to do in Houston: museums, parks, and local experiences.',
    url: 'https://explorehtx.us.com/things-to-do/free',
    type: 'website',
  },
};

async function fetchFreeAttractions(): Promise<Attraction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('status', 'active')
    .eq('price_type', 'free')
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching free attractions:', error.message);
    return [];
  }

  return (data as Attraction[]) ?? [];
}

async function fetchCategories(): Promise<AttractionCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attraction_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    return [];
  }

  return (data as AttractionCategory[]) ?? [];
}

interface AttractionsByCategory {
  category: AttractionCategory;
  attractions: Attraction[];
}

export default async function FreeAttractionsPage() {
  const [attractions, categories] = await Promise.all([
    fetchFreeAttractions(),
    fetchCategories(),
  ]);

  // Build category lookup map
  const categoryMap = new Map<string, AttractionCategory>(
    categories.map((cat) => [cat.id, cat])
  );

  // Group attractions by category
  const grouped = attractions.reduce<Record<string, Attraction[]>>(
    (acc, attraction) => {
      const catId = attraction.category_id;
      if (catId) {
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(attraction);
      }
      return acc;
    },
    {}
  );

  // Build result array maintaining category order
  const categoryGroups: AttractionsByCategory[] = categories
    .filter((cat) => grouped[cat.id] && grouped[cat.id].length > 0)
    .map((category) => ({
      category,
      attractions: grouped[category.id],
    }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Things To Do', href: '/things-to-do' },
          { name: 'Free Activities', href: '/things-to-do/free' },
        ]}
      />

      {/* Page header */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/things-to-do"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            All Things To Do
          </Link>

          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-3">
              <Gift className="w-5 h-5" />
              Free Activities
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Free Things To Do in Houston
            </h1>
            <p className="mt-4 text-white/80 text-lg leading-relaxed">
              Explore Houston without spending a dime. Free museums, beautiful
              parks, outdoor concerts, and local experiences.
            </p>
            <p className="mt-4 text-white/60">
              {attractions.length} free {attractions.length === 1 ? 'activity' : 'activities'}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured free attractions */}
        {attractions.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                All Free Attractions
              </h2>
              <span className="text-sm text-gray-500">
                {attractions.length} free {attractions.length === 1 ? 'spot' : 'spots'}
              </span>
            </div>
            <AttractionGrid
              attractions={attractions}
              categories={categoryMap}
              emptyMessage="No free attractions found yet. Check back soon!"
            />
          </section>
        )}

        {/* Category breakdown */}
        {categoryGroups.length > 1 && (
          <section className="mt-16 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Free Activities by Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryGroups.map(({ category, attractions: catAttractions }) => (
                <Link
                  key={category.slug}
                  href={`/things-to-do/category/${category.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 group-hover:text-sunset-orange-600 transition-colors">
                      {category.name}
                    </h3>
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      <Gift className="w-3 h-3" />
                      {catAttractions.length} free
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {catAttractions.slice(0, 3).map((attr) => (
                      <span
                        key={attr.id}
                        className="text-xs text-gray-400 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {attr.name}
                      </span>
                    ))}
                    {catAttractions.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{catAttractions.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {attractions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
              <Gift className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No free activities yet
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              We&apos;re curating Houston&apos;s best free activities. Check back
              soon for parks, museums, and more!
            </p>
            <Link
              href="/things-to-do"
              className="mt-6 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Browse All Attractions
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
