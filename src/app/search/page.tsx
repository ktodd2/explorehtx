import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, FileText, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Event, BlogPost } from '@/types/database';
import SearchBar from '@/components/search/SearchBar';
import { formatEventDate } from '@/lib/utils/dates';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;

  return {
    title: q
      ? `"${q}" — Search Results | ExploreHTX`
      : 'Search Houston Events | ExploreHTX',
    description:
      'Search Houston events, concerts, food, nightlife, and local blog posts on ExploreHTX.',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  let events: Event[] = [];
  let posts: BlogPost[] = [];

  if (query) {
    const supabase = await createClient();
    const pattern = `%${query}%`;

    const [eventsResult, postsResult] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('start_date', { ascending: true })
        .limit(24),

      supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .order('published_at', { ascending: false })
        .limit(12),
    ]);

    events = eventsResult.data ?? [];
    posts = postsResult.data ?? [];
  }

  const totalResults = events.length + posts.length;
  const hasResults = totalResults > 0;

  return (
    <>
      {/* Hero / Search input ──────────────────────────────────────────────── */}
      <section className="bg-space-blue-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Search <span className="text-sunset-orange-400">Houston</span>
          </h1>
          <p className="text-space-blue-200 mb-8">
            Find events, concerts, restaurants, and local stories
          </p>
          <SearchBar
            defaultValue={query}
            size="lg"
            className="max-w-xl mx-auto"
          />
        </div>
      </section>

      {/* Results ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* No query state */}
        {!query && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              What are you looking for?
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Type a search term above to find Houston events, blog posts, and more.
            </p>
          </div>
        )}

        {/* Query with no results */}
        {query && !hasResults && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              No results for &ldquo;{query}&rdquo;
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Try different keywords or browse by category.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/events"
                className="px-5 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                Browse Events
              </Link>
              <Link
                href="/events/this-weekend"
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
              >
                This Weekend
              </Link>
              <Link
                href="/blog"
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
              >
                Read the Blog
              </Link>
            </div>
          </div>
        )}

        {/* Results summary */}
        {query && hasResults && (
          <p className="text-gray-500 text-sm mb-8">
            Found{' '}
            <span className="font-semibold text-gray-800">{totalResults}</span>{' '}
            {totalResults === 1 ? 'result' : 'results'} for{' '}
            <span className="font-semibold text-gray-800">&ldquo;{query}&rdquo;</span>
          </p>
        )}

        {/* Events section */}
        {events.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-sunset-orange-500" />
              <h2 className="font-display text-xl font-bold text-gray-900">
                Events
              </h2>
              <span className="ml-auto text-sm text-gray-400">
                {events.length} {events.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-5"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 bg-sunset-orange-100 text-sunset-orange-700 text-xs font-semibold rounded-full capitalize">
                      {event.category.replace(/-/g, ' ')}
                    </span>
                    {event.is_free && (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                        Free
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 group-hover:text-sunset-orange-600 transition-colors line-clamp-2 leading-snug mb-2">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-auto space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
                      <span>{formatEventDate(event.start_date)}</span>
                    </div>
                    {(event.venue_name || event.neighborhood) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
                        <span className="truncate">
                          {event.venue_name ?? event.neighborhood}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Blog posts section */}
        {posts.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-sunset-orange-500" />
              <h2 className="font-display text-xl font-bold text-gray-900">
                Blog Posts
              </h2>
              <span className="ml-auto text-sm text-gray-400">
                {posts.length} {posts.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                >
                  {/* Cover image placeholder */}
                  <div className="h-40 bg-gradient-to-br from-sunset-orange-100 to-sunset-orange-200 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-10 h-10 text-sunset-orange-400" />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-sunset-orange-600 uppercase tracking-wide mb-1">
                      {post.post_type.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-sunset-orange-600 transition-colors line-clamp-2 leading-snug mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    {post.reading_time_minutes && (
                      <p className="mt-auto pt-3 text-xs text-gray-400">
                        {post.reading_time_minutes} min read
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
