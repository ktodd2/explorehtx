// =============================================================================
// ExploreHTX — Base Event Adapter
// Defines the shared NormalizedEvent shape and the abstract EventAdapter class
// that all source-specific adapters must implement.
// =============================================================================

/**
 * The canonical event shape that every adapter must produce.
 * Downstream code (deduplication, DB upsert, categorization) consumes this.
 */
export interface NormalizedEvent {
  /** Unique identifier within the source system. */
  externalId: string
  /** Slug identifying the data source. */
  source: string // 'ticketmaster' | 'eventbrite' | 'google' | 'visithouston' | 'community'
  /** Canonical URL on the source platform. */
  sourceUrl: string
  title: string
  description: string
  /** ISO 8601 datetime string. */
  startDate: string
  /** ISO 8601 datetime string. */
  endDate?: string
  isAllDay?: boolean
  venueName?: string
  venueAddress?: string
  lat?: number
  lng?: number
  /**
   * One of the project's EventCategory slugs.
   * Leave undefined to let the auto-categorization pass assign one.
   */
  category?: string
  tags?: string[]
  imageUrl?: string
  imageAlt?: string
  priceMin?: number
  priceMax?: number
  isFree?: boolean
  ticketUrl?: string
  organizerName?: string
  /** Full raw payload from the source API for debugging / re-processing. */
  rawData: Record<string, unknown>
}

/**
 * All event source adapters must extend this class and implement
 * `source` (a stable slug) and `fetch` (which returns normalized events).
 */
export abstract class EventAdapter {
  abstract readonly source: string
  abstract fetch(): Promise<NormalizedEvent[]>
}
