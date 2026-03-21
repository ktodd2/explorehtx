import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, BookOpen } from 'lucide-react'
import type { BlogPost, BlogPostType } from '@/types/database'

interface BlogCardProps {
  post: BlogPost
}

/** Map post type slugs to display labels */
const POST_TYPE_LABELS: Record<BlogPostType, string> = {
  weekend_roundup: 'Weekend Roundup',
  neighborhood_guide: 'Neighborhood Guide',
  seasonal_guide: 'Seasonal Guide',
  event_spotlight: 'Event Spotlight',
  listicle: 'List',
  restaurant_spotlight: 'Restaurant Spotlight',
  date_night_guide: 'Date Night Guide',
  attraction_spotlight: 'Attraction Spotlight',
}

/** Map post types to badge color classes */
const POST_TYPE_BADGE_COLORS: Record<BlogPostType, string> = {
  weekend_roundup: 'bg-sunset-orange-100 text-sunset-orange-700',
  neighborhood_guide: 'bg-space-blue-100 text-space-blue-700',
  seasonal_guide: 'bg-emerald-100 text-emerald-700',
  event_spotlight: 'bg-purple-100 text-purple-700',
  listicle: 'bg-amber-100 text-amber-700',
  restaurant_spotlight: 'bg-rose-100 text-rose-700',
  date_night_guide: 'bg-pink-100 text-pink-700',
  attraction_spotlight: 'bg-teal-100 text-teal-700',
}

/** Map post types to gradient classes for cover image placeholders */
const POST_TYPE_GRADIENTS: Record<BlogPostType, string> = {
  weekend_roundup: 'from-sunset-orange-400 to-sunset-orange-700',
  neighborhood_guide: 'from-space-blue-500 to-space-blue-800',
  seasonal_guide: 'from-emerald-500 to-emerald-800',
  event_spotlight: 'from-purple-500 to-purple-800',
  listicle: 'from-amber-400 to-amber-700',
  restaurant_spotlight: 'from-rose-400 to-rose-700',
  date_night_guide: 'from-pink-400 to-pink-700',
  attraction_spotlight: 'from-teal-400 to-teal-700',
}

function formatPublishedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

export default function BlogCard({ post }: BlogCardProps) {
  const badgeColor = POST_TYPE_BADGE_COLORS[post.post_type]
  const gradient = POST_TYPE_GRADIENTS[post.post_type]
  const typeLabel = POST_TYPE_LABELS[post.post_type]

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
      aria-label={`Read: ${post.title}`}
    >
      {/* Cover image or gradient placeholder */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            aria-hidden="true"
          >
            <BookOpen className="w-12 h-12 text-white/40" />
          </div>
        )}

        {/* Post type badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm bg-white/90 backdrop-blur-sm ${badgeColor}`}>
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-display font-bold text-gray-900 text-base leading-snug group-hover:text-sunset-orange-600 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-gray-400">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatPublishedDate(post.published_at)}
            </span>
          )}
          {post.reading_time_minutes != null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time_minutes} min read
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400 group-hover:text-sunset-orange-500 transition-colors font-medium">
            Read &rsaquo;
          </span>
        </div>
      </div>
    </Link>
  )
}
