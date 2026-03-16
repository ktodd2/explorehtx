import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, ChevronLeft, ChevronRight, PenLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BlogCard from '@/components/blog/BlogCard'
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd'
import type { BlogPost } from '@/types/database'

export const metadata: Metadata = {
  title: 'Houston Blog - Local Guides & Event Roundups',
  description:
    'Discover Houston through our local guides, weekend roundups, neighborhood spotlights, and curated event lists. Your insider guide to the Bayou City.',
  alternates: {
    canonical: 'https://explorehtx.us.com/blog',
  },
  openGraph: {
    title: 'Houston Blog - Local Guides & Event Roundups | ExploreHTX',
    description:
      'Weekend guides, neighborhood spotlights, and the best event roundups for Houston, TX.',
    url: 'https://explorehtx.us.com/blog',
    type: 'website',
  },
}

const PAGE_SIZE = 12

interface SearchParams {
  page?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

async function fetchBlogPosts(
  page: number
): Promise<{ posts: BlogPost[]; total: number }> {
  const supabase = await createClient()
  const offset = (page - 1) * PAGE_SIZE

  const { data, error, count } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    console.error('Error fetching blog posts:', error.message)
    return { posts: [], total: 0 }
  }

  return { posts: (data as BlogPost[]) ?? [], total: count ?? 0 }
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const { posts, total } = await fetchBlogPosts(page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildPageUrl = (p: number) =>
    p > 1 ? `/blog?page=${p}` : '/blog'

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Blog', href: '/blog' },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-space-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-space-blue-900 via-space-blue-800 to-sunset-orange-900 opacity-95" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-sunset-orange-500/20 text-sunset-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-5">
              <PenLine className="w-4 h-4" />
              Houston Local Guides
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              The ExploreHTX Blog
            </h1>
            <p className="mt-4 text-space-blue-200 text-lg leading-relaxed">
              Weekend roundups, neighborhood spotlights, and the best of Houston —
              curated by locals, published weekly.
            </p>
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Count */}
        {total > 0 && (
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-semibold text-gray-900">{total}</span>{' '}
            {total === 1 ? 'post' : 'posts'} published
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </p>
        )}

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-sunset-orange-100 text-sunset-orange-500 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
              No posts yet
            </h2>
            <p className="text-gray-500 max-w-md leading-relaxed">
              Our AI-powered blog is warming up. Houston guides, weekend roundups, and
              neighborhood spotlights are on their way — check back soon!
            </p>
            <Link
              href="/events"
              className="mt-8 inline-flex items-center gap-2 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-sunset-orange-500/20"
            >
              Browse Houston Events
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="mt-12 flex items-center justify-center gap-2"
            aria-label="Blog pagination"
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

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1
                const show =
                  p === 1 || p === totalPages || Math.abs(p - page) <= 1

                if (!show && (p === 2 || p === totalPages - 1)) {
                  return (
                    <span key={p} className="px-1 text-gray-400">
                      …
                    </span>
                  )
                }
                if (!show) return null

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
                )
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
      </div>

      {/* Newsletter CTA */}
      <section className="bg-space-blue-900 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Get Houston Guides in Your Inbox
          </h2>
          <p className="text-space-blue-200 text-lg mb-8">
            Weekend roundups, neighborhood guides, and the best Houston events —
            delivered every Friday.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-space-blue-300 focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sunset-orange-500/25"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-4 text-sm text-space-blue-300">
            Free. No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </>
  )
}
