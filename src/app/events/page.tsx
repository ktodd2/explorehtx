import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, HelpCircle, Map, List } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventGrid from '@/components/events/EventGrid';
import EventFilters from '@/components/events/EventFilters';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import {
  getToday,
  getThisWeek,
  getThisWeekend,
  getThisMonth,
} from '@/lib/utils/dates';
import type { Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Houston Events & Things to Do',
  description:
    'Browse hundreds of Houston events — concerts, festivals, food events, sports, and more. Updated daily so you never miss what\'s happening in the Bayou City.',
  alternates: {
    canonical: 'https://explorehtx.us.com/events',
  },
  openGraph: {
    title: 'Houston Events & Things to Do | ExploreHTX',
    description:
      'Browse hundreds of Houston events — concerts, festivals, food events, sports, and more.',
    url: 'https://explorehtx.us.com/events',
    type: 'website',
  },
};

const PAGE_SIZE = 24;

interface SearchParams {
  q?: string;
  category?: string;
  date?: string;
  neighborhood?: string;
  free?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function fetchEvents(
  params: SearchParams
): Promise<{ events: Event[]; total: number }> {
  const supabase = await createClient();

  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('start_date', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  // Text search
  if (params.q) {
    query = query.ilike('title', `%${params.q}%`);
  }

  // Category filter
  if (params.category) {
    query = query.eq('category', params.category);
  }

  // Free filter
  if (params.free === 'true') {
    query = query.eq('is_free', true);
  }

  // Neighborhood filter
  if (params.neighborhood) {
    query = query.eq('neighborhood', params.neighborhood);
  }

  // Date range filter
  if (params.date) {
    let range: { start: string; end: string } | null = null;
    if (params.date === 'today') range = getToday();
    else if (params.date === 'this-week') range = getThisWeek();
    else if (params.date === 'this-weekend') range = getThisWeekend();
    else if (params.date === 'this-month') range = getThisMonth();

    if (range) {
      query = query
        .gte('start_date', range.start)
        .lte('start_date', range.end);
    }
  } else {
    // Default: only future events
    query = query.gte('start_date', new Date().toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching events:', error.message);
    return { events: [], total: 0 };
  }

  return { events: (data as Event[]) ?? [], total: count ?? 0 };
}

async function fetchFilterOptions(): Promise<{
  categories: string[];
  neighborhoods: string[];
}> {
  const supabase = await createClient();

  const [catResult, nbrResult] = await Promise.all([
    supabase
      .from('events')
      .select('category')
      .eq('status', 'active')
      .order('category'),
    supabase
      .from('events')
      .select('neighborhood')
      .eq('status', 'active')
      .not('neighborhood', 'is', null)
      .order('neighborhood'),
  ]);

  const categories = [
    ...new Set((catResult.data ?? []).map((r: { category: string }) => r.category)),
  ] as string[];

  const neighborhoods = [
    ...new Set(
      (nbrResult.data ?? [])
        .map((r: { neighborhood: string | null }) => r.neighborhood)
        .filter(Boolean)
    ),
  ] as string[];

  return { categories, neighborhoods };
}

const EVENT_FAQ = [
  {
    question: 'What events are happening in Houston this weekend?',
    answer:
      'ExploreHTX lists hundreds of Houston events every weekend including concerts, festivals, food events, sports, and family activities. Use our "This Weekend" filter to see all upcoming weekend events, or browse by category to find exactly what you\'re looking for.',
  },
  {
    question: 'Where can I find free events in Houston?',
    answer:
      'Houston has many free events each week. Use our "Free Events" filter to find concerts in the park, museum free days, community festivals, outdoor markets, and more. We update our free events list daily.',
  },
  {
    question: 'How do I find family-friendly Houston events?',
    answer:
      'Browse our Family & Kids category to find events suitable for all ages. From children\'s museums and zoo activities to outdoor festivals and educational workshops, we curate family-friendly options across Houston.',
  },
];

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const [{ events, total }, { categories, neighborhoods }] = await Promise.all([
    fetchEvents(params),
    fetchFilterOptions(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(
    params.q ||
    params.category ||
    params.date ||
    params.neighborhood ||
    params.free
  );

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.category) sp.set('category', params.category);
    if (params.date) sp.set('date', params.date);
    if (params.neighborhood) sp.set('neighborhood', params.neighborhood);
    if (params.free) sp.set('free', params.free);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `/events?${qs}` : '/events';
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Events', href: '/events' },
        ]}
      />
      <FAQJsonLd items={EVENT_FAQ} />

      {/* Page header */}
      <section className="bg-space-blue-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sunset-orange-400 text-sm font-medium mb-3">
              <Calendar className="w-4 h-4" />
              Houston Events
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Things To Do in Houston
            </h1>
            <p className="mt-4 text-space-blue-200 text-lg leading-relaxed">
              Concerts, festivals, food events, sports, and everything in
              between. Updated daily.
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Suspense fallback={null}>
          <EventFilters
            categories={categories}
            neighborhoods={neighborhoods}
          />
        </Suspense>

        {/* Results count and view toggle */}
        <div className="mt-6 mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {hasFilters ? (
              <>
                <span className="font-semibold text-gray-900">{total}</span>{' '}
                {total === 1 ? 'event' : 'events'} found
              </>
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-gray-900">{total}</span>{' '}
                upcoming {total === 1 ? 'event' : 'events'}
              </>
            )}
          </p>

          <div className="flex items-center gap-3">
            {total > PAGE_SIZE && (
              <p className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </p>
            )}
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-space-blue-900 rounded-md">
                <List className="w-4 h-4" />
                List
              </span>
              <Link
                href="/events/map"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors"
              >
                <Map className="w-4 h-4" />
                Map
              </Link>
            </div>
          </div>
        </div>

        {/* Grid */}
        <EventGrid
          events={events}
          emptyMessage={
            hasFilters
              ? 'No events match your filters.'
              : 'No upcoming events found. Check back soon!'
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="mt-12 flex items-center justify-center gap-2"
            aria-label="Pagination"
          >
            {page > 1 && (
              <Link
                href={buildPageUrl(page - 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Link>
            )}

            {/* Page number pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                // Show first, last, current, and neighbors
                const p = i + 1;
                const show =
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1;

                if (!show && (p === 2 || p === totalPages - 1)) {
                  return (
                    <span key={p} className="px-1 text-gray-400">
                      …
                    </span>
                  );
                }
                if (!show) return null;

                return (
                  <Link
                    key={p}
                    href={buildPageUrl(p)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-xl transition-colors ${
                      p === page
                        ? 'bg-space-blue-900 text-white shadow-md'
                        : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    aria-current={p === page ? 'page' : undefined}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            {page < totalPages && (
              <Link
                href={buildPageUrl(page + 1)}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </nav>
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
            {EVENT_FAQ.map((faq, index) => (
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
