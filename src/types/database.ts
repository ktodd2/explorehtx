// =============================================================================
// ExploreHTX — Database Type Definitions
// Mirrors the Supabase schema defined in 001_initial_schema.sql
// =============================================================================

// =============================================================================
// Utility / Union Types
// =============================================================================

export type EventStatus = 'active' | 'cancelled' | 'postponed' | 'archived'

export type BlogPostType =
  | 'weekend_roundup'
  | 'neighborhood_guide'
  | 'seasonal_guide'
  | 'event_spotlight'
  | 'listicle'

export type BlogPostStatus = 'draft' | 'published' | 'archived'

export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced'

export type SubscriberFrequency = 'daily' | 'weekly' | 'monthly'

export type EmailLogStatus = 'sent' | 'delivered' | 'bounced' | 'failed'

export type IngestionJobStatus = 'running' | 'completed' | 'failed'

/** Matches the category slugs seeded in the initial migration. */
export type EventCategory =
  | 'music-concerts'
  | 'sports'
  | 'food-dining'
  | 'arts-culture'
  | 'nightlife'
  | 'family-kids'
  | 'outdoor-parks'
  | 'festivals'
  | 'free-events'
  | 'comedy'
  | 'theater'
  | 'markets-shopping'

// =============================================================================
// Table Interfaces
// =============================================================================

/**
 * Represents a row in the `events` table.
 * `start_date` and other timestamptz columns are returned as ISO 8601 strings
 * from the Supabase JS client.
 */
export interface Event {
  id: string
  external_id: string | null
  source: string | null
  source_url: string | null
  title: string
  slug: string
  description: string | null
  description_html: string | null
  start_date: string
  end_date: string | null
  is_all_day: boolean
  venue_name: string | null
  venue_address: string | null
  venue_lat: number | null
  venue_lng: number | null
  neighborhood: string | null
  category: string
  tags: string[]
  image_url: string | null
  image_alt: string | null
  price_min: number | null
  price_max: number | null
  is_free: boolean
  ticket_url: string | null
  organizer_name: string | null
  status: EventStatus
  featured: boolean
  popularity_score: number
  created_at: string
  updated_at: string
  raw_data: Record<string, unknown> | null
}

/**
 * Represents a row in the `blog_posts` table.
 */
export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  content_html: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  author: string
  post_type: BlogPostType
  category: string | null
  tags: string[]
  meta_title: string | null
  meta_description: string | null
  keywords: string[]
  related_event_ids: string[]
  status: BlogPostStatus
  published_at: string | null
  ai_generated: boolean
  ai_model: string | null
  ai_prompt_hash: string | null
  word_count: number | null
  reading_time_minutes: number | null
  created_at: string
  updated_at: string
}

/**
 * Represents a row in the `categories` table.
 */
export interface Category {
  id: string
  name: string
  slug: EventCategory
  description: string | null
  icon: string | null
  meta_title: string | null
  meta_description: string | null
  display_order: number
  is_active: boolean
}

/**
 * Represents a row in the `neighborhoods` table.
 */
export interface Neighborhood {
  id: string
  name: string
  slug: string
  description: string | null
  meta_title: string | null
  meta_description: string | null
  lat: number | null
  lng: number | null
  image_url: string | null
  is_active: boolean
}

/**
 * Represents a row in the `subscribers` table.
 */
export interface Subscriber {
  id: string
  email: string
  name: string | null
  categories: string[]
  neighborhoods: string[]
  frequency: SubscriberFrequency
  is_verified: boolean
  verification_token: string | null
  unsubscribe_token: string
  last_email_sent_at: string | null
  status: SubscriberStatus
  created_at: string
  updated_at: string
}

/**
 * Represents a row in the `email_logs` table.
 */
export interface EmailLog {
  id: string
  subscriber_id: string | null
  email_type: string
  resend_id: string | null
  subject: string | null
  status: EmailLogStatus
  sent_at: string
}

/**
 * Represents a row in the `ingestion_logs` table.
 */
export interface IngestionLog {
  id: string
  source: string
  job_type: string
  status: IngestionJobStatus
  events_fetched: number
  events_created: number
  events_updated: number
  events_deduplicated: number
  error_message: string | null
  duration_ms: number | null
  started_at: string
  completed_at: string | null
}

// =============================================================================
// Insert / Update Helpers
// =============================================================================

/**
 * Payload for creating a new event. Omits server-managed fields.
 */
export type InsertEvent = Omit<Event, 'id' | 'created_at' | 'updated_at'> &
  Partial<Pick<Event, 'id' | 'created_at' | 'updated_at'>>

/**
 * Payload for creating a new blog post. Omits server-managed fields.
 */
export type InsertBlogPost = Omit<
  BlogPost,
  'id' | 'created_at' | 'updated_at'
> &
  Partial<Pick<BlogPost, 'id' | 'created_at' | 'updated_at'>>

/**
 * Payload for subscribing a new user. Omits server-managed fields.
 */
export type InsertSubscriber = Omit<
  Subscriber,
  'id' | 'unsubscribe_token' | 'created_at' | 'updated_at'
> &
  Partial<
    Pick<Subscriber, 'id' | 'unsubscribe_token' | 'created_at' | 'updated_at'>
  >

/**
 * Generic partial update types — all fields optional except the primary key.
 */
export type UpdateEvent = Partial<Omit<Event, 'id'>>
export type UpdateBlogPost = Partial<Omit<BlogPost, 'id'>>
export type UpdateSubscriber = Partial<Omit<Subscriber, 'id'>>
