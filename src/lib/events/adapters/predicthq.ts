// =============================================================================
// ExploreHTX — PredictHQ Adapter
// Fetches events from the PredictHQ Events API for the Houston area.
// =============================================================================

import { EventAdapter, NormalizedEvent } from './base'

const API_BASE = 'https://api.predicthq.com/v1/events/'
const PAGE_SIZE = 100

/** Houston, TX coordinates. */
const HOUSTON_LAT = 29.7604
const HOUSTON_LNG = -95.3698
const RADIUS_KM = 50

// ---------------------------------------------------------------------------
// PredictHQ API response shapes (partial — only fields we consume)
// ---------------------------------------------------------------------------

interface PhqEntity {
  entity_id: string
  name: string
  type: string
}

interface PhqEvent {
  id: string
  title: string
  description?: string
  category: string
  start: string
  end?: string
  location?: [number, number] // GeoJSON order: [longitude, latitude]
  entities?: PhqEntity[]
  labels?: string[]
  state?: string
  scope?: string
  country?: string
  [key: string]: unknown
}

interface PhqResponse {
  count: number
  next: string | null
  previous: string | null
  results: PhqEvent[]
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const CATEGORY_MAP: Record<string, string> = {
  concerts: 'music-concerts',
  'performing-arts': 'arts-culture',
  sports: 'sports',
  community: 'community',
  festivals: 'festivals',
  conferences: 'community',
  expos: 'community',
  'academic': 'community',
  'school-holidays': 'family-kids',
  'public-holidays': 'community',
  'daylight-savings': 'community',
  'airport-delays': 'community',
  'severe-weather': 'community',
  politics: 'community',
  terror: 'community',
  health: 'community',
}

/**
 * Map a PredictHQ category to an ExploreHTX EventCategory slug.
 * Returns undefined when no mapping is found so the auto-categorization
 * pass can assign one.
 */
function mapCategory(category: string): string | undefined {
  return CATEGORY_MAP[category] ?? undefined
}

// ---------------------------------------------------------------------------
// Event normalizer
// ---------------------------------------------------------------------------

function findVenue(entities?: PhqEntity[]): PhqEntity | undefined {
  return entities?.find((e) => e.type === 'venue')
}

function normalizeEvent(raw: PhqEvent): NormalizedEvent | null {
  if (!raw.id || !raw.title || !raw.start) return null

  // PredictHQ location uses GeoJSON order: [longitude, latitude]
  const lng = raw.location?.[0]
  const lat = raw.location?.[1]

  const venue = findVenue(raw.entities)

  // Build a description from available fields
  const descParts: string[] = []
  if (raw.description) {
    descParts.push(raw.description)
  } else {
    // Synthesise a basic description from metadata
    const categoryLabel = raw.category.replace(/-/g, ' ')
    descParts.push(`${raw.title} — ${categoryLabel}.`)
    if (venue) {
      descParts.push(`Taking place at ${venue.name}.`)
    }
  }

  const description = descParts.join('\n\n')

  return {
    externalId: raw.id,
    source: 'predicthq',
    sourceUrl: `https://api.predicthq.com/v1/events/${raw.id}`,
    title: raw.title,
    description,
    startDate: raw.start,
    endDate: raw.end,
    isAllDay: false,
    venueName: venue?.name,
    venueAddress: undefined,
    lat,
    lng,
    category: mapCategory(raw.category),
    tags: raw.labels ?? [],
    imageUrl: undefined,
    imageAlt: undefined,
    priceMin: undefined,
    priceMax: undefined,
    isFree: undefined,
    ticketUrl: undefined,
    organizerName: undefined,
    rawData: raw as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class PredictHQAdapter extends EventAdapter {
  readonly source = 'predicthq'

  async fetch(): Promise<NormalizedEvent[]> {
    const apiKey = process.env.PREDICTHQ_API_KEY
    if (!apiKey) {
      console.warn('[PredictHQ] PREDICTHQ_API_KEY is not set — skipping fetch.')
      return []
    }

    const now = new Date()
    const thirtyDaysOut = new Date(now)
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)

    const activeAfter = now.toISOString()
    const activeBefore = thirtyDaysOut.toISOString()

    const events: NormalizedEvent[] = []
    let nextUrl: string | null = this.buildInitialUrl(activeAfter, activeBefore)
    let page = 0
    const MAX_PAGES = 10

    console.log('[PredictHQ] Starting event fetch for Houston, TX...')

    while (nextUrl && page < MAX_PAGES) {
      try {
        const response = await fetch(nextUrl, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          console.error(
            `[PredictHQ] API error on page ${page + 1}: ${response.status} ${response.statusText}`
          )
          break
        }

        const data = (await response.json()) as PhqResponse

        console.log(
          `[PredictHQ] Page ${page + 1}: received ${data.results.length} events (total: ${data.count})`
        )

        for (const raw of data.results) {
          const normalized = normalizeEvent(raw)
          if (normalized) events.push(normalized)
        }

        nextUrl = data.next
        page++
      } catch (err) {
        console.error(`[PredictHQ] Network error on page ${page + 1}:`, err)
        break
      }
    }

    console.log(`[PredictHQ] Fetch complete. Returning ${events.length} normalized events.`)
    return events
  }

  /**
   * Build the initial request URL with query parameters for Houston-area
   * active events in the next 30 days.
   */
  private buildInitialUrl(activeAfter: string, activeBefore: string): string {
    const params = new URLSearchParams({
      'within': `${RADIUS_KM}km@${HOUSTON_LAT},${HOUSTON_LNG}`,
      'active.gte': activeAfter,
      'active.lte': activeBefore,
      'state': 'active',
      'country': 'US',
      'limit': String(PAGE_SIZE),
      'sort': 'start',
    })

    return `${API_BASE}?${params.toString()}`
  }
}
