// =============================================================================
// ExploreHTX — Eventbrite Adapter
// Fetches events from the Eventbrite API v3 for the Houston metro area.
// =============================================================================

import { EventAdapter, NormalizedEvent } from './base'

const API_BASE = 'https://www.eventbriteapi.com/v3/events/search/'

// ---------------------------------------------------------------------------
// Eventbrite API response shapes (partial — only fields we consume)
// ---------------------------------------------------------------------------

interface EbMultiText {
  text?: string
  html?: string
}

interface EbDateTime {
  utc?: string
  local?: string
  timezone?: string
}

interface EbVenueAddress {
  address_1?: string
  address_2?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
  latitude?: string
  longitude?: string
  localized_address_display?: string
}

interface EbVenue {
  id?: string
  name?: string
  address?: EbVenueAddress
}

interface EbTicketAvailability {
  minimum_ticket_price?: { major_value?: string; currency?: string }
  maximum_ticket_price?: { major_value?: string; currency?: string }
  is_free?: boolean
}

interface EbCategory {
  id?: string
  name?: string
  name_localized?: string
  short_name?: string
}

interface EbLogo {
  url?: string
  original?: { url?: string }
}

interface EbOrganizer {
  name?: string
}

interface EbEvent {
  id: string
  name?: EbMultiText
  description?: EbMultiText
  summary?: string
  url?: string
  start?: EbDateTime
  end?: EbDateTime
  is_free?: boolean
  logo?: EbLogo
  venue?: EbVenue
  ticket_availability?: EbTicketAvailability
  category?: EbCategory
  subcategory?: EbCategory
  tags?: Array<{ tag?: string; display_name?: string }>
  organizer?: EbOrganizer
  [key: string]: unknown
}

interface EbResponse {
  events?: EbEvent[]
  pagination?: {
    object_count?: number
    page_number?: number
    page_size?: number
    page_count?: number
    has_more_items?: boolean
    continuation?: string
  }
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

/**
 * Map Eventbrite category names to our EventCategory slugs.
 */
function mapCategory(category?: EbCategory, subcategory?: EbCategory): string | undefined {
  const name = (category?.name ?? category?.short_name ?? '').toLowerCase()
  const sub = (subcategory?.name ?? subcategory?.short_name ?? '').toLowerCase()

  if (name.includes('music')) return 'music-concerts'
  if (name.includes('sport') || name.includes('fitness')) return 'sports'
  if (name.includes('food') || name.includes('drink') || name.includes('dining')) return 'food-dining'
  if (name.includes('art') || name.includes('culture')) return 'arts-culture'
  if (name.includes('film') || name.includes('media')) return 'arts-culture'
  if (name.includes('perform') || name.includes('theatre') || name.includes('theater')) {
    if (sub.includes('comedy')) return 'comedy'
    return 'theater'
  }
  if (name.includes('comedy')) return 'comedy'
  if (name.includes('nightlife') || name.includes('bar')) return 'nightlife'
  if (name.includes('family') || name.includes('kids') || name.includes('children')) return 'family-kids'
  if (name.includes('outdoor') || name.includes('nature')) return 'outdoor-parks'
  if (name.includes('festival') || name.includes('fair')) return 'festivals'
  if (name.includes('shopping') || name.includes('market')) return 'markets-shopping'
  if (name.includes('holiday') || name.includes('seasonal')) return 'festivals'
  if (name.includes('community') || name.includes('government')) return undefined
  if (name.includes('science') || name.includes('technology')) return undefined

  return undefined
}

// ---------------------------------------------------------------------------
// Event normalizer
// ---------------------------------------------------------------------------

function normalizeEvent(raw: EbEvent): NormalizedEvent | null {
  const id = raw.id
  if (!id) return null

  const startDate = raw.start?.utc ?? raw.start?.local
  if (!startDate) return null

  const endDate = raw.end?.utc ?? raw.end?.local

  // Description — prefer plain text; fall back to summary
  const description = raw.description?.text ?? raw.summary ?? ''

  // Venue
  const venue = raw.venue
  const venueName = venue?.name
  const address = venue?.address
  const builtAddress = [address?.address_1, address?.city, address?.region]
    .filter(Boolean)
    .join(', ') || undefined
  const venueAddress = address?.localized_address_display ?? builtAddress
  const lat = address?.latitude ? parseFloat(address.latitude) : undefined
  const lng = address?.longitude ? parseFloat(address.longitude) : undefined

  // Price
  const availability = raw.ticket_availability
  const isFree = raw.is_free ?? availability?.is_free ?? false
  const priceMin = availability?.minimum_ticket_price?.major_value
    ? parseFloat(availability.minimum_ticket_price.major_value)
    : isFree
    ? 0
    : undefined
  const priceMax = availability?.maximum_ticket_price?.major_value
    ? parseFloat(availability.maximum_ticket_price.major_value)
    : undefined

  // Image — prefer original (highest resolution)
  const imageUrl = raw.logo?.original?.url ?? raw.logo?.url

  // Tags
  const tags = raw.tags
    ?.map((t) => t.display_name ?? t.tag)
    .filter((t): t is string => Boolean(t)) ?? []

  return {
    externalId: id,
    source: 'eventbrite',
    sourceUrl: raw.url ?? `https://www.eventbrite.com/e/${id}`,
    title: raw.name?.text ?? 'Untitled Event',
    description,
    startDate,
    endDate,
    venueName,
    venueAddress,
    lat,
    lng,
    category: mapCategory(raw.category, raw.subcategory),
    tags,
    imageUrl,
    imageAlt: raw.name?.text,
    priceMin,
    priceMax,
    isFree,
    ticketUrl: raw.url,
    organizerName: raw.organizer?.name,
    rawData: raw as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class EventbriteAdapter extends EventAdapter {
  readonly source = 'eventbrite'

  async fetch(): Promise<NormalizedEvent[]> {
    const token = process.env.EVENTBRITE_API_TOKEN
    if (!token) {
      console.warn('[Eventbrite] EVENTBRITE_API_TOKEN is not set — skipping fetch.')
      return []
    }

    const events: NormalizedEvent[] = []
    let continuation: string | undefined
    let hasMore = true
    let pageNum = 0

    console.log('[Eventbrite] Starting event fetch for Houston metro area...')

    while (hasMore) {
      const params = new URLSearchParams({
        'location.address': 'Houston, TX',
        'location.within': '50mi',
        expand: 'venue,ticket_availability,category,subcategory,organizer',
        sort_by: 'date',
      })

      if (continuation) {
        params.set('continuation', continuation)
      }

      const url = `${API_BASE}?${params.toString()}`

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          console.error(
            `[Eventbrite] API error on page ${pageNum + 1}: ${response.status} ${response.statusText}`
          )
          break
        }

        const data = (await response.json()) as EbResponse

        const rawEvents = data.events ?? []
        console.log(
          `[Eventbrite] Page ${pageNum + 1}: received ${rawEvents.length} events`
        )

        for (const raw of rawEvents) {
          const normalized = normalizeEvent(raw)
          if (normalized) events.push(normalized)
        }

        hasMore = data.pagination?.has_more_items ?? false
        continuation = data.pagination?.continuation
        pageNum++

        // Safety cap to avoid runaway pagination
        if (pageNum >= 10) {
          console.log('[Eventbrite] Reached page cap (10). Stopping pagination.')
          break
        }
      } catch (err) {
        console.error(`[Eventbrite] Network error on page ${pageNum + 1}:`, err)
        break
      }
    }

    console.log(`[Eventbrite] Fetch complete. Returning ${events.length} normalized events.`)
    return events
  }
}
