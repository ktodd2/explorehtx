import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Gift,
  Building,
  Trees,
  Baby,
  Mountain,
  Star,
  Dumbbell,
  HelpCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AttractionGrid from '@/components/attractions/AttractionGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import type { Attraction, AttractionCategory } from '@/types/database';

export const metadata: Metadata = {
  title: 'Things To Do in Houston | Museums, Parks & Free Activities',
  description:
    'Discover Houston attractions: museums, parks, free activities, neighborhoods, and local experiences. Curated guide to the best things to do in Houston.',
  alternates: {
    canonical: 'https://explorehtx.us.com/things-to-do',
  },
  openGraph: {
    title: 'Things To Do in Houston | ExploreHTX',
    description:
      'Discover Houston attractions: museums, parks, free activities, and local experiences.',
    url: 'https://explorehtx.us.com/things-to-do',
    type: 'website',
  },
};

const THINGS_TO_DO_FAQ = [
  {
    question: 'What are free things to do in Houston?',
    answer:
      'Houston offers many free activities including the Houston Museum District free days, Hermann Park, Buffalo Bayou Park trails, Discovery Green, and the Menil Collection. Check our Free Activities section for a complete list of no-cost attractions.',
  },
  {
    question: 'What are the best Houston museums?',
    answer:
      'Houston is home to world-class museums including the Museum of Fine Arts Houston, the Houston Museum of Natural Science, Space Center Houston, the Children\'s Museum of Houston, and the Contemporary Arts Museum Houston. Many offer free admission days.',
  },
  {
    question: 'What outdoor activities are in Houston?',
    answer:
      'Houston has extensive green spaces including Hermann Park, Memorial Park, Buffalo Bayou Park, and the Houston Arboretum. Popular outdoor activities include hiking, biking, kayaking on Buffalo Bayou, and visiting the Houston Zoo.',
  },
];

/** Map category slugs to Lucide icons */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'museums-culture': Building,
  'parks-nature': Trees,
  'free-activities': Gift,
  'neighborhoods': MapPin,
  'family-fun': Baby,
  'outdoor-adventures': Mountain,
  'local-experiences': Star,
  'sports-recreation': Dumbbell,
};

interface AttractionsByCategory {
  category: AttractionCategory;
  attractions: Attraction[];
}

async function fetchCategories(): Promise<AttractionCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attraction_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error.message);
    return [];
  }

  return (data as AttractionCategory[]) ?? [];
}

async function fetchAttractionsByCategory(
  categories: AttractionCategory[]
): Promise<AttractionsByCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('status', 'active')
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching attractions:', error.message);
    return [];
  }

  const attractions = (data as Attraction[]) ?? [];

  // Group by category
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
  return categories
    .filter((cat) => grouped[cat.id] && grouped[cat.id].length > 0)
    .map((category) => ({
      category,
      attractions: grouped[category.id],
    }));
}

async function fetchFeaturedAttractions(): Promise<Attraction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .order('popularity_score', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured attractions:', error.message);
    return [];
  }

  return (data as Attraction[]) ?? [];
}

export default async function ThingsToDoPage() {
  const categories = await fetchCategories();
  const [categoryGroups, featuredAttractions] = await Promise.all([
    fetchAttractionsByCategory(categories),
    fetchFeaturedAttractions(),
  ]);

  // Build category lookup map
  const categoryMap = new Map<string, AttractionCategory>(
    categories.map((cat) => [cat.id, cat])
  );

  const totalAttractions = categoryGroups.reduce(
    (sum, group) => sum + group.attractions.length,
    0
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Things To Do', href: '/things-to-do' },
        ]}
      />
      <FAQJsonLd items={THINGS_TO_DO_FAQ} />

      {/* Page header */}
      <section className="bg-space-blue-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sunset-orange-400 text-sm font-medium mb-3">
              <MapPin className="w-4 h-4" />
              Houston Attractions
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Things To Do in Houston
            </h1>
            <p className="mt-4 text-space-blue-200 text-lg leading-relaxed">
              Museums, parks, free activities, and local experiences.
              Your guide to exploring Space City beyond the events.
            </p>
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/things-to-do/free"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-400 text-white font-semibold text-sm rounded-xl transition-colors shadow-md"
            >
              <Gift className="w-4 h-4" />
              Free Activities
            </Link>
            {categories.slice(0, 4).map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] || MapPin;
              return (
                <Link
                  key={category.slug}
                  href={`/things-to-do/category/${category.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-space-blue-700 hover:bg-space-blue-600 text-white font-medium text-sm rounded-xl transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured section */}
        {featuredAttractions.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Attractions
              </h2>
              <span className="text-sm text-gray-500">
                {totalAttractions} attractions total
              </span>
            </div>
            <AttractionGrid
              attractions={featuredAttractions}
              categories={categoryMap}
            />
          </section>
        )}

        {/* Category sections */}
        {categoryGroups.map(({ category, attractions }) => {
          const Icon = CATEGORY_ICONS[category.slug] || MapPin;
          return (
            <section
              key={category.slug}
              id={category.slug}
              className="mb-16 scroll-mt-24"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <Icon className="w-6 h-6 text-sunset-orange-500" />
                  {category.name}
                </h2>
                <Link
                  href={`/things-to-do/category/${category.slug}`}
                  className="text-sm text-sunset-orange-600 hover:text-sunset-orange-700 font-medium transition-colors"
                >
                  View all &rsaquo;
                </Link>
              </div>
              {category.description && (
                <p className="text-gray-500 mb-6 max-w-2xl">
                  {category.description}
                </p>
              )}
              <AttractionGrid
                attractions={attractions.slice(0, 6)}
                categories={categoryMap}
              />
            </section>
          );
        })}

        {/* Empty state */}
        {categoryGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No attractions yet
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              We&apos;re curating Houston&apos;s best attractions. Check back
              soon for museums, parks, and more!
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
            {THINGS_TO_DO_FAQ.map((faq, index) => (
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
