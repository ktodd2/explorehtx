// =============================================================================
// ExploreHTX — Facebook Events Adapter
// Scrapes public Facebook event pages for major Houston venues/organizations.
//
// NOTE: Facebook pages are heavily JavaScript-rendered, so this adapter
// extracts what it can from static HTML (JSON-LD, meta tags, inline scripts).
// This is the lowest-priority adapter — missing data is expected and fine.
// =============================================================================

import { createHash } from 'node:crypto'
import { EventAdapter, NormalizedEvent } from './base'

// ---------------------------------------------------------------------------
// Houston venue Facebook event pages
// ---------------------------------------------------------------------------

interface VenueConfig {
  url: string
  name: string
}

const HOUSTON_VENUES: VenueConfig[] = [
  {
    url: 'https://www.facebook.com/HoustonTheater/events/',
    name: 'Houston Theater',
  },
  {
    url: 'https://www.facebook.com/DiscoveryGreen/events/',
    name: 'Discovery Green',
  },
  {
    url: 'https://www.facebook.com/milleroutdoortheatre/events/',
    name: 'Miller Outdoor Theatre',
  },
  {
    url: 'https://www.facebook.com/HoustonZoo/events/',
    name: 'Houston Zoo',
  },
  {
    url: 'https://www.facebook.com/hmaboretum/events/',
    name: 'Houston Arboretum',
  },
  {
    url: 'https://www.facebook.com/buffalobayou/events/',
    name: 'Buffalo Bayou Park',
  },
]

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a stable, deterministic external ID from a string (e.g. a URL).
 * Uses SHA-256 truncated to 16 hex characters for brevity while retaining
 * collision resistance well beyond the volume of events we handle.
 */
function hashId(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

/**
 * Extract a Facebook event numeric ID from a URL string.
 * Returns the numeric ID if found, otherwise null.
 */
function extractFacebookEventId(url: string): string | null {
  const match = url.match(/\/events\/(\d+)/)
  return match ? match[1] : null
}

// ---------------------------------------------------------------------------
// JSON-LD extraction
// ---------------------------------------------------------------------------

interface JsonLdEvent {
  '@type'?: string
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  url?: string
  image?: string | { url?: string }
  location?: {
    '@type'?: string
    name?: string
    address?: string | { streetAddress?: string; addressLocality?: string; addressRegion?: string }
    geo?: { latitude?: number; longitude?: number }
  }
  organizer?: { name?: string } | string
  offers?: {
    price?: number | string
    priceCurrency?: string
    url?: string
    lowPrice?: number | string
    highPrice?: number | string
    availability?: string
  }
  performer?: { name?: string }
  [key: string]: unknown
}

/**
 * Parse all JSON-LD script blocks from raw HTML and return any that
 * look like Event objects.
 */
function extractJsonLdEvents(html: string): JsonLdEvent[] {
  const events: JsonLdEvent[] = []
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (
          item?.['@type'] === 'Event' ||
          item?.['@type']?.includes?.('Event')
        ) {
          events.push(item as JsonLdEvent)
        }
      }
    } catch {
      // Malformed JSON-LD — skip silently
    }
  }

  return events
}

// ---------------------------------------------------------------------------
// Open Graph meta tag extraction
// ---------------------------------------------------------------------------

interface OgMeta {
  title?: string
  description?: string
  image?: string
  url?: string
}

function extractOgMeta(html: string): OgMeta {
  const get = (property: string): string | undefined => {
    const regex = new RegExp(
      `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`,
      'i'
    )
    const alt = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`,
      'i'
    )
    return regex.exec(html)?.[1] ?? alt.exec(html)?.[1]
  }

  return {
    title: get('title'),
    description: get('description'),
    image: get('image'),
    url: get('url'),
  }
}

// ---------------------------------------------------------------------------
// Inline script event data extraction
// ---------------------------------------------------------------------------

interface InlineEventData {
  id?: string
  name?: string
  start_time?: string
  end_time?: string
  place?: { name?: string; location?: { latitude?: number; longitude?: number; street?: string; city?: string; state?: string } }
  cover?: { source?: string }
  description?: string
  ticket_uri?: string
  is_online?: boolean
  [key: string]: unknown
}

/**
 * Attempt to find event data embedded in inline <script> blocks.
 * Facebook occasionally embeds event JSON in script globals or
 * data attributes; this is best-effort.
 */
function extractInlineScriptEvents(html: string): InlineEventData[] {
  const events: InlineEventData[] = []

  // Look for patterns like "event_id":"12345" or event-like JSON blobs
  const eventIdRegex = /"event_id"\s*:\s*"(\d+)"/g
  const eventNameRegex = /"event_name"\s*:\s*"([^"]+)"/g

  // Try to find event data blocks that look like serialised event objects
  const dataRegex = /\{"__typename"\s*:\s*"Event"[^}]*(?:\{[^}]*\}[^}]*)*\}/g
  let dataMatch: RegExpExecArray | null

  while ((dataMatch = dataRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(dataMatch[0])
      if (parsed) events.push(parsed as InlineEventData)
    } catch {
      // Partial or malformed JSON — expected from script scraping
    }
  }

  // Also look for event URLs in the HTML to at least capture event references
  const eventUrlRegex = /href="(\/events\/(\d+)[^"]*)"/g
  let urlMatch: RegExpExecArray | null
  const seenIds = new Set(events.map((e) => e.id).filter(Boolean))

  while ((urlMatch = eventUrlRegex.exec(html)) !== null) {
    const eventId = urlMatch[2]
    if (eventId && !seenIds.has(eventId)) {
      seenIds.add(eventId)
      events.push({ id: eventId })
    }
  }

  // Deduplicate by ID — only keep unique entries
  void eventIdRegex
  void eventNameRegex

  return events
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeJsonLdEvent(
  raw: JsonLdEvent,
  venueConfig: VenueConfig
): NormalizedEvent | null {
  const title = raw.name
  const startDate = raw.startDate

  if (!title || !startDate) return null

  const eventUrl =
    typeof raw.url === 'string' ? raw.url : venueConfig.url
  const eventId = extractFacebookEventId(eventUrl) ?? hashId(eventUrl + title)

  const imageUrl =
    typeof raw.image === 'string'
      ? raw.image
      : (raw.image as { url?: string })?.url

  // Location handling
  let venueName = venueConfig.name
  let venueAddress: string | undefined
  let lat: number | undefined
  let lng: number | undefined

  if (raw.location) {
    venueName = raw.location.name ?? venueName
    if (typeof raw.location.address === 'string') {
      venueAddress = raw.location.address
    } else if (raw.location.address) {
      venueAddress = [
        raw.location.address.streetAddress,
        raw.location.address.addressLocality,
        raw.location.address.addressRegion,
      ]
        .filter(Boolean)
        .join(', ') || undefined
    }
    lat = raw.location.geo?.latitude
    lng = raw.location.geo?.longitude
  }

  // Organizer
  const organizerName =
    typeof raw.organizer === 'string'
      ? raw.organizer
      : raw.organizer?.name ?? venueConfig.name

  // Pricing
  let priceMin: number | undefined
  let priceMax: number | undefined
  let isFree: boolean | undefined
  let ticketUrl: string | undefined

  if (raw.offers) {
    const low = raw.offers.lowPrice ?? raw.offers.price
    const high = raw.offers.highPrice ?? raw.offers.price
    if (low !== undefined) priceMin = typeof low === 'number' ? low : parseFloat(String(low))
    if (high !== undefined) priceMax = typeof high === 'number' ? high : parseFloat(String(high))
    isFree = priceMin === 0 && (priceMax === undefined || priceMax === 0)
    ticketUrl = raw.offers.url
  }

  return {
    externalId: `fb-${eventId}`,
    source: 'facebook',
    sourceUrl: eventUrl.startsWith('http')
      ? eventUrl
      : `https://www.facebook.com${eventUrl}`,
    title,
    description: raw.description ?? '',
    startDate,
    endDate: raw.endDate,
    venueName,
    venueAddress,
    lat,
    lng,
    imageUrl,
    imageAlt: title,
    priceMin: Number.isNaN(priceMin) ? undefined : priceMin,
    priceMax: Number.isNaN(priceMax) ? undefined : priceMax,
    isFree,
    ticketUrl,
    organizerName,
    rawData: raw as Record<string, unknown>,
  }
}

function normalizeInlineEvent(
  raw: InlineEventData,
  venueConfig: VenueConfig
): NormalizedEvent | null {
  const eventId = raw.id
  if (!eventId) return null

  const title = raw.name
  const startDate = raw.start_time
  if (!title || !startDate) return null

  const sourceUrl = `https://www.facebook.com/events/${eventId}/`

  let venueAddress: string | undefined
  let lat: number | undefined
  let lng: number | undefined

  if (raw.place?.location) {
    const loc = raw.place.location
    venueAddress = [loc.street, loc.city, loc.state].filter(Boolean).join(', ') || undefined
    lat = loc.latitude
    lng = loc.longitude
  }

  return {
    externalId: `fb-${eventId}`,
    source: 'facebook',
    sourceUrl,
    title,
    description: raw.description ?? '',
    startDate,
    endDate: raw.end_time,
    venueName: raw.place?.name ?? venueConfig.name,
    venueAddress,
    lat,
    lng,
    imageUrl: raw.cover?.source,
    imageAlt: title,
    ticketUrl: raw.ticket_uri,
    organizerName: venueConfig.name,
    rawData: raw as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class FacebookEventsAdapter extends EventAdapter {
  readonly source = 'facebook'

  async fetch(): Promise<NormalizedEvent[]> {
    const allEvents: NormalizedEvent[] = []
    const seenIds = new Set<string>()

    console.log(
      `[Facebook] Starting scrape of ${HOUSTON_VENUES.length} Houston venue pages...`
    )

    for (const venue of HOUSTON_VENUES) {
      try {
        const events = await this.scrapeVenuePage(venue)

        for (const event of events) {
          if (!seenIds.has(event.externalId)) {
            seenIds.add(event.externalId)
            allEvents.push(event)
          }
        }

        console.log(
          `[Facebook] ${venue.name}: found ${events.length} event(s)`
        )
      } catch (err) {
        console.warn(
          `[Facebook] Failed to scrape ${venue.name} (${venue.url}):`,
          err instanceof Error ? err.message : err
        )
        // Continue to next venue
      }
    }

    console.log(
      `[Facebook] Scrape complete. Returning ${allEvents.length} normalized events.`
    )
    return allEvents
  }

  // -------------------------------------------------------------------------
  // Per-venue scraping
  // -------------------------------------------------------------------------

  private async scrapeVenuePage(venue: VenueConfig): Promise<NormalizedEvent[]> {
    const response = await fetch(venue.url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      console.warn(
        `[Facebook] HTTP ${response.status} for ${venue.name}`
      )
      return []
    }

    const html = await response.text()
    if (!html || html.length < 500) {
      console.warn(`[Facebook] Empty or minimal response for ${venue.name}`)
      return []
    }

    const events: NormalizedEvent[] = []
    const seenIds = new Set<string>()

    // Strategy 1: JSON-LD structured data (most reliable if present)
    const jsonLdEvents = extractJsonLdEvents(html)
    for (const raw of jsonLdEvents) {
      const normalized = normalizeJsonLdEvent(raw, venue)
      if (normalized && !seenIds.has(normalized.externalId)) {
        seenIds.add(normalized.externalId)
        events.push(normalized)
      }
    }

    // Strategy 2: Inline script event data
    const inlineEvents = extractInlineScriptEvents(html)
    for (const raw of inlineEvents) {
      const normalized = normalizeInlineEvent(raw, venue)
      if (normalized && !seenIds.has(normalized.externalId)) {
        seenIds.add(normalized.externalId)
        events.push(normalized)
      }
    }

    // Strategy 3: If we found no structured events but have OG meta, create
    // a single event entry from the page-level metadata. This acts as a
    // fallback so the venue is at least represented in the pipeline.
    if (events.length === 0) {
      const og = extractOgMeta(html)
      if (og.title && og.title.toLowerCase().includes('event')) {
        // OG meta describes the events page itself, not a single event —
        // not useful to create a NormalizedEvent from it. Skip.
        console.log(
          `[Facebook] ${venue.name}: no structured events found, OG meta is page-level — skipping`
        )
      }
    }

    return events
  }
}
