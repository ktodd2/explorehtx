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
  | 'restaurant_spotlight'
  | 'date_night_guide'
  | 'attraction_spotlight'

// =============================================================================
// Restaurant Types
// =============================================================================

export type PriceRange = '$' | '$$' | '$$$' | '$$$$'

export type NoiseLevel = 'quiet' | 'moderate' | 'lively' | 'loud'

export type RestaurantStatus = 'active' | 'archived' | 'coming_soon'

// =============================================================================
// Attraction Types
// =============================================================================

export type AttractionPriceType = 'free' | 'paid' | 'donation' | 'varies'

export type AttractionStatus = 'active' | 'archived' | 'coming_soon'

/**
 * Hours for a single day: { open: "09:00", close: "17:00" }
 */
export interface AttractionDayHours {
  open: string
  close: string
}

/**
 * Full week hours for attractions: keyed by lowercase day name
 */
export type AttractionHours = Partial<
  Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    AttractionDayHours
  >
>

/**
 * Hours for a single day: { open: "11:00", close: "22:00" }
 */
export interface RestaurantDayHours {
  open: string
  close: string
}

/**
 * Full week hours: keyed by lowercase day name
 */
export type RestaurantHours = Partial<
  Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    RestaurantDayHours
  >
>

/**
 * Menu highlights organized by category
 */
export interface MenuHighlights {
  appetizers?: string[]
  mains?: string[]
  pasta?: string[]
  pizza?: string[]
  'cold-tastings'?: string[]
  'hot-tastings'?: string[]
  sushi?: string[]
  meats?: string[]
  sides?: string[]
  'small-plates'?: string[]
  desserts?: string[]
  [key: string]: string[] | undefined
}

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
  venue_id: string | null
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
  related_restaurant_ids: string[]
  related_attraction_ids: string[]
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
 * Represents a row in the `restaurants` table.
 */
export interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null

  // Location
  address: string | null
  neighborhood: string | null
  lat: number | null
  lng: number | null

  // Contact
  phone: string | null
  website_url: string | null
  reservation_url: string | null
  menu_url: string | null

  // Cuisine
  cuisine_type: string
  cuisine_tags: string[]

  // Pricing
  price_range: PriceRange
  avg_price_per_person: number | null

  // Hours
  hours: RestaurantHours

  // Ambiance & Features
  ambiance: string[]
  features: string[]
  dress_code: string | null
  noise_level: NoiseLevel | null

  // Date Night
  date_night_labels: string[]
  best_for: string[]

  // Menu
  signature_dishes: string[]
  menu_highlights: MenuHighlights

  // Media
  image_url: string | null
  gallery_urls: string[]

  // Metadata
  status: RestaurantStatus
  featured: boolean
  popularity_score: number
  has_happy_hour: boolean
  created_at: string
  updated_at: string

  // Discovery tracking (AI-generated restaurants)
  ai_generated: boolean
  discovery_source: string | null   // 'manual', 'ai-research'
  confidence_score: number | null   // 0-100
  last_featured_at: string | null
}

/**
 * Represents a row in the `attraction_categories` table.
 */
export interface AttractionCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * Represents a row in the `attractions` table.
 */
export interface Attraction {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null

  // Location
  address: string | null
  neighborhood: string | null
  lat: number | null
  lng: number | null

  // Contact
  phone: string | null
  website_url: string | null

  // Category & Tags
  category_id: string | null
  tags: string[]

  // Pricing
  price_type: AttractionPriceType
  price_range: string | null
  price_notes: string | null

  // Hours
  hours: AttractionHours
  seasonal_notes: string | null

  // Features
  features: string[]
  accessibility: string[]
  best_for: string[]
  duration_minutes: number | null

  // Media
  image_url: string | null
  image_alt: string | null
  gallery_urls: string[]

  // Metadata
  status: AttractionStatus
  featured: boolean
  popularity_score: number
  created_at: string
  updated_at: string
}

/**
 * Attraction with its category joined (for display purposes)
 */
export interface AttractionWithCategory extends Attraction {
  category: AttractionCategory | null
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
 * Payload for creating a new restaurant. Omits server-managed fields.
 */
export type InsertRestaurant = Omit<
  Restaurant,
  'id' | 'created_at' | 'updated_at'
> &
  Partial<Pick<Restaurant, 'id' | 'created_at' | 'updated_at'>>

/**
 * Payload for creating a new attraction. Omits server-managed fields.
 */
export type InsertAttraction = Omit<
  Attraction,
  'id' | 'created_at' | 'updated_at'
> &
  Partial<Pick<Attraction, 'id' | 'created_at' | 'updated_at'>>

/**
 * Payload for creating a new attraction category. Omits server-managed fields.
 */
export type InsertAttractionCategory = Omit<
  AttractionCategory,
  'id' | 'created_at' | 'updated_at'
> &
  Partial<Pick<AttractionCategory, 'id' | 'created_at' | 'updated_at'>>

/**
 * Generic partial update types — all fields optional except the primary key.
 */
export type UpdateEvent = Partial<Omit<Event, 'id'>>
export type UpdateBlogPost = Partial<Omit<BlogPost, 'id'>>
export type UpdateSubscriber = Partial<Omit<Subscriber, 'id'>>
export type UpdateRestaurant = Partial<Omit<Restaurant, 'id'>>
export type UpdateAttraction = Partial<Omit<Attraction, 'id'>>
export type UpdateAttractionCategory = Partial<Omit<AttractionCategory, 'id'>>

// =============================================================================
// Happy Hour Types
// =============================================================================

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Sunday = 0, Saturday = 6

/**
 * A single deal in a happy hour
 */
export interface HappyHourDeal {
  type: 'drink' | 'food' | 'other'
  description: string
  original_price?: string
}

/**
 * Represents a row in the `happy_hours` table.
 */
export interface HappyHour {
  id: string
  restaurant_id: string
  day_of_week: DayOfWeek
  start_time: string // "16:00"
  end_time: string   // "19:00"
  deals: HappyHourDeal[]
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Happy hour with joined restaurant data
 */
export interface HappyHourWithRestaurant extends HappyHour {
  restaurant: Restaurant
}

/**
 * Payload for creating a new happy hour
 */
export type InsertHappyHour = Omit<HappyHour, 'id' | 'created_at' | 'updated_at'> &
  Partial<Pick<HappyHour, 'id' | 'created_at' | 'updated_at'>>

export type UpdateHappyHour = Partial<Omit<HappyHour, 'id'>>

// =============================================================================
// Venue Types
// =============================================================================

export type VenueStatus = 'active' | 'archived' | 'coming_soon'

/**
 * Represents a row in the `venues` table.
 */
export interface Venue {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null

  // Location
  address: string | null
  neighborhood: string | null
  lat: number | null
  lng: number | null

  // Contact & links
  phone: string | null
  website_url: string | null
  booking_url: string | null

  // Venue type and capacity
  venue_type: string | null
  capacity: number | null

  // Features
  features: string[]
  amenities: string[]

  // Media
  image_url: string | null
  image_alt: string | null
  gallery_urls: string[]

  // Metadata
  status: VenueStatus
  featured: boolean
  popularity_score: number
  created_at: string
  updated_at: string
}

/**
 * Venue with upcoming events count
 */
export interface VenueWithEventCount extends Venue {
  upcoming_events_count: number
}

/**
 * Payload for creating a new venue
 */
export type InsertVenue = Omit<Venue, 'id' | 'created_at' | 'updated_at'> &
  Partial<Pick<Venue, 'id' | 'created_at' | 'updated_at'>>

export type UpdateVenue = Partial<Omit<Venue, 'id'>>

// =============================================================================
// Review Types
// =============================================================================

export type ReviewEntityType = 'restaurant' | 'attraction'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

/**
 * Represents a row in the `reviews` table.
 */
export interface Review {
  id: string
  entity_type: ReviewEntityType
  entity_id: string
  rating: number // 1-5
  title: string | null
  content: string
  reviewer_name: string
  reviewer_email: string
  is_verified: boolean
  verification_token: string | null
  status: ReviewStatus
  moderation_note: string | null
  moderated_at: string | null
  helpful_count: number
  created_at: string
  updated_at: string
}

/**
 * Aggregated rating for an entity
 */
export interface EntityRating {
  average_rating: number
  review_count: number
}

/**
 * Payload for creating a new review
 */
export type InsertReview = Omit<
  Review,
  'id' | 'is_verified' | 'verification_token' | 'status' | 'moderation_note' | 'moderated_at' | 'helpful_count' | 'created_at' | 'updated_at'
> & Partial<Pick<Review, 'id' | 'status' | 'created_at' | 'updated_at'>>

export type UpdateReview = Partial<Omit<Review, 'id'>>

// =============================================================================
// Event Submission Types
// =============================================================================

export type EventSubmissionStatus = 'pending' | 'approved' | 'rejected'

/**
 * Represents a row in the `event_submissions` table.
 */
export interface EventSubmission {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  is_all_day: boolean
  venue_name: string | null
  venue_address: string | null
  category: string
  tags: string[]
  image_url: string | null
  price_min: number | null
  price_max: number | null
  is_free: boolean
  ticket_url: string | null
  organizer_name: string | null
  organizer_email: string
  organizer_phone: string | null
  organizer_website: string | null
  status: EventSubmissionStatus
  moderation_note: string | null
  moderated_at: string | null
  moderated_by: string | null
  approved_event_id: string | null
  ip_address: string | null
  user_agent: string | null
  submitted_at: string
  updated_at: string
}

/**
 * Payload for creating a new event submission
 */
export type InsertEventSubmission = Omit<
  EventSubmission,
  'id' | 'status' | 'moderation_note' | 'moderated_at' | 'moderated_by' | 'approved_event_id' | 'submitted_at' | 'updated_at'
> & Partial<Pick<EventSubmission, 'id' | 'status' | 'submitted_at' | 'updated_at'>>

export type UpdateEventSubmission = Partial<Omit<EventSubmission, 'id'>>
