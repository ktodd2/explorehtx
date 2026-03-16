import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  ChevronRight,
  User,
  Twitter,
  Facebook,
  Share2,
  List,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BlogJsonLd from '@/components/blog/BlogJsonLd'
import EventCard from '@/components/events/EventCard'
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd'
import { truncate } from '@/lib/utils/format'
import type { BlogPost, BlogPostType, Event } from '@/types/database'

// ---------------------------------------------------------------------------
// Static params (empty — posts are generated dynamically)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ slug: string }>
}

interface TocEntry {
  id: string
  text: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'https://explorehtx.us.com'

const POST_TYPE_LABELS: Record<BlogPostType, string> = {
  weekend_roundup: 'Weekend Roundup',
  neighborhood_guide: 'Neighborhood Guide',
  seasonal_guide: 'Seasonal Guide',
  event_spotlight: 'Event Spotlight',
  listicle: 'List',
}

const POST_TYPE_BADGE_COLORS: Record<BlogPostType, string> = {
  weekend_roundup: 'bg-sunset-orange-100 text-sunset-orange-700',
  neighborhood_guide: 'bg-space-blue-100 text-space-blue-700',
  seasonal_guide: 'bg-emerald-100 text-emerald-700',
  event_spotlight: 'bg-purple-100 text-purple-700',
  listicle: 'bg-amber-100 text-amber-700',
}

const POST_TYPE_HERO_GRADIENT: Record<BlogPostType, string> = {
  weekend_roundup: 'from-sunset-orange-700 to-sunset-orange-950',
  neighborhood_guide: 'from-space-blue-700 to-space-blue-950',
  seasonal_guide: 'from-emerald-700 to-emerald-950',
  event_spotlight: 'from-purple-700 to-purple-950',
  listicle: 'from-amber-600 to-amber-900',
}

function formatPublishedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  })
}

/**
 * Extract H2 headings from HTML content for the table of contents.
 * Returns an array of { id, text } entries.
 */
function extractToc(html: string): TocEntry[] {
  const pattern = /<h2[^>]*>(.*?)<\/h2>/gi
  const entries: TocEntry[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null) {
    const raw = match[1].replace(/<[^>]+>/g, '').trim()
    if (!raw) continue
    const id = raw
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    entries.push({ id, text: raw })
  }

  return entries
}

/**
 * Inject `id` attributes into h2 tags in the HTML so TOC anchor links work.
 */
function injectHeadingIds(html: string): string {
  return html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    return `<h2${attrs} id="${id}">${inner}</h2>`
  })
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function fetchPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('Error fetching blog post:', error.message)
    return null
  }

  return data as BlogPost | null
}

async function fetchRelatedEvents(eventIds: string[]): Promise<Event[]> {
  if (eventIds.length === 0) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(6)

  return (data as Event[]) ?? []
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('blog_posts')
    .select('title, excerpt, meta_title, meta_description, cover_image_url, cover_image_alt, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) {
    return { title: 'Post Not Found' }
  }

  const title = data.meta_title ?? data.title
  const description = data.meta_description ?? data.excerpt
    ? truncate(data.meta_description ?? data.excerpt ?? '', 155)
    : `${data.title} — Houston local guide from ExploreHTX.`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/blog/${slug}`,
      type: 'article',
      ...(data.published_at ? { publishedTime: data.published_at } : {}),
      ...(data.cover_image_url
        ? {
            images: [
              {
                url: data.cover_image_url,
                alt: data.cover_image_alt ?? data.title,
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: data.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(data.cover_image_url ? { images: [data.cover_image_url] } : {}),
    },
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await fetchPost(slug)

  if (!post) notFound()

  const relatedEvents = await fetchRelatedEvents(post.related_event_ids)

  const gradient =
    POST_TYPE_HERO_GRADIENT[post.post_type] ?? 'from-space-blue-700 to-space-blue-950'
  const typeLabel = POST_TYPE_LABELS[post.post_type]
  const badgeColor = POST_TYPE_BADGE_COLORS[post.post_type]
  const pageUrl = `${BASE_URL}/blog/${post.slug}`

  // Process content HTML: inject heading IDs + extract TOC
  const processedHtml = post.content_html ? injectHeadingIds(post.content_html) : ''
  const toc = post.content_html ? extractToc(post.content_html) : []

  return (
    <>
      <BlogJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Blog', href: '/blog' },
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      {/* Hero */}
      <section className="relative min-h-[45vh] sm:min-h-[55vh] bg-gray-900 overflow-hidden flex items-end">
        {post.cover_image_url ? (
          <>
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent" />
          </>
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
            aria-hidden="true"
          />
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-sm text-white/60 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
          </nav>

          {/* Post type badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/20`}
            >
              {typeLabel}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-4xl">
            {post.title}
          </h1>

          {/* Author + meta */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {post.author}
            </span>
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatPublishedDate(post.published_at)}
              </span>
            )}
            {post.reading_time_minutes != null && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Main content */}
          <article className="lg:col-span-3 space-y-8">
            {/* Excerpt / lede */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed font-medium border-l-4 border-sunset-orange-400 pl-5">
                {post.excerpt}
              </p>
            )}

            {/* Post type badge (mobile-friendly repeat) */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${badgeColor}`}>
                {typeLabel}
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Rendered HTML content */}
            {processedHtml && (
              <div
                className="prose prose-gray prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-sunset-orange-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-sunset-orange-400 prose-blockquote:bg-sunset-orange-50 prose-blockquote:py-1 prose-blockquote:rounded-r-lg prose-strong:text-gray-900 max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />
            )}

            {/* Share buttons */}
            <section className="pt-6 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Share This Post
              </h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(pageUrl)}&via=explorehtx`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
                <button
                  data-copy-url={pageUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  aria-label="Copy link"
                  type="button"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            </section>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Table of contents */}
            {toc.length > 2 && (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 sticky top-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <List className="w-4 h-4 text-sunset-orange-500" />
                  In This Post
                </div>
                <nav aria-label="Table of contents">
                  <ol className="space-y-2">
                    {toc.map((entry, i) => (
                      <li key={entry.id}>
                        <a
                          href={`#${entry.id}`}
                          className="flex items-start gap-2 text-sm text-gray-600 hover:text-sunset-orange-600 transition-colors leading-snug"
                        >
                          <span className="text-xs font-bold text-gray-300 mt-0.5 flex-shrink-0 w-4">
                            {i + 1}.
                          </span>
                          <span>{entry.text}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            )}

            {/* Post meta card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Type
                </p>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${badgeColor}`}>
                  {typeLabel}
                </span>
              </div>

              {post.published_at && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Published
                  </p>
                  <p className="text-sm text-gray-700">
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'America/Chicago',
                    })}
                  </p>
                </div>
              )}

              {post.reading_time_minutes != null && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Reading Time
                  </p>
                  <p className="text-sm text-gray-700">
                    {post.reading_time_minutes} min read
                  </p>
                </div>
              )}

              {post.word_count != null && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Word Count
                  </p>
                  <p className="text-sm text-gray-700">
                    {post.word_count.toLocaleString()} words
                  </p>
                </div>
              )}
            </div>

            {/* Back to blog */}
            <Link
              href="/blog"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              All Houston Guides
            </Link>
          </aside>
        </div>

        {/* Related events section */}
        {relatedEvents.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Events Mentioned in This Post
              </h2>
              <Link
                href="/events"
                className="text-sm text-sunset-orange-600 hover:text-sunset-orange-700 font-medium flex items-center gap-1 transition-colors"
              >
                All Events
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="mt-16 bg-space-blue-900 rounded-3xl px-8 py-12 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            Never Miss a Houston Guide
          </h2>
          <p className="text-space-blue-200 mb-8 max-w-lg mx-auto">
            Get weekly roundups, neighborhood spotlights, and the best Houston events
            delivered straight to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-space-blue-300 focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sunset-orange-500/25 whitespace-nowrap"
            >
              Subscribe Free
            </button>
          </form>
          <p className="mt-4 text-sm text-space-blue-300">No spam. Unsubscribe anytime.</p>
        </section>
      </div>
    </>
  )
}
