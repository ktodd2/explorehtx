import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  ChevronLeft,
  Building,
  Trees,
  Gift,
  Baby,
  Mountain,
  Star,
  Dumbbell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AttractionGrid from '@/components/attractions/AttractionGrid';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Attraction, AttractionCategory } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

async function fetchCategory(slug: string): Promise<AttractionCategory | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attraction_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AttractionCategory;
}

async function fetchAttractionsByCategory(categoryId: string): Promise<Attraction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('status', 'active')
    .eq('category_id', categoryId)
    .order('popularity_score', { ascending: false });

  if (error) {
    console.error('Error fetching attractions:', error.message);
    return [];
  }

  return (data as Attraction[]) ?? [];
}

async function fetchAllCategories(): Promise<AttractionCategory[]> {
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const title = `${category.name} in Houston | Things To Do`;
  const description =
    category.description ??
    `Discover ${category.name.toLowerCase()} in Houston. Explore the best ${category.name.toLowerCase()} that Houston has to offer.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://explorehtx.us.com/things-to-do/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://explorehtx.us.com/things-to-do/category/${slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  if (!category) {
    notFound();
  }

  const [attractions, allCategories] = await Promise.all([
    fetchAttractionsByCategory(category.id),
    fetchAllCategories(),
  ]);

  const categoryMap = new Map<string, AttractionCategory>(
    allCategories.map((cat) => [cat.id, cat])
  );

  const Icon = CATEGORY_ICONS[slug] || MapPin;
  const gradient = CATEGORY_GRADIENTS[slug] || 'from-space-blue-600 to-space-blue-900';

  // Get other categories for navigation
  const otherCategories = allCategories.filter((cat) => cat.slug !== slug);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Things To Do', href: '/things-to-do' },
          { name: category.name, href: `/things-to-do/category/${slug}` },
        ]}
      />

      {/* Page header */}
      <section className={`bg-gradient-to-br ${gradient} py-12 sm:py-16`}>
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
              <Icon className="w-5 h-5" />
              Category
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-4 text-white/80 text-lg leading-relaxed">
                {category.description}
              </p>
            )}
            <p className="mt-4 text-white/60">
              {attractions.length} {attractions.length === 1 ? 'attraction' : 'attractions'}
            </p>
          </div>

          {/* Other categories */}
          <div className="mt-8 flex flex-wrap gap-3">
            {otherCategories.slice(0, 5).map((cat) => {
              const CatIcon = CATEGORY_ICONS[cat.slug] || MapPin;
              return (
                <Link
                  key={cat.slug}
                  href={`/things-to-do/category/${cat.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition-colors"
                >
                  <CatIcon className="w-4 h-4" />
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Attractions grid */}
        <AttractionGrid
          attractions={attractions}
          categories={categoryMap}
          emptyMessage={`No ${category.name.toLowerCase()} found yet. Check back soon!`}
        />
      </div>
    </>
  );
}
