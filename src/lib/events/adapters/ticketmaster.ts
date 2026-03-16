// =============================================================================
// ExploreHTX — Ticketmaster Adapter
// Fetches events from the Ticketmaster Discovery API v2 for the Houston area.
// =============================================================================

import { EventAdapter, NormalizedEvent } from './base'

const API_BASE = 'https://app.ticketmaster.com/discovery/v2/events.json'
const PAGE_SIZE = 200

// ---------------------------------------------------------------------------
// Ticketmaster API response shapes (partial — only fields we consume)
// ---------------------------------------------------------------------------

interface TmImage {
  url: string
  ratio?: string
  width?: number
  height?: number
  fallback?: boolean
}

interface TmPriceRange {
  type?: string
  currency?: string
  min?: number
  max?: number
}

interface TmVenue {
  name?: string
  address?: { line1?: string }
  city?: { name?: string }
  state?: { stateCode?: string }
  country?: { countryCode?: string }
  location?: { latitude?: string; longitude?: string }
}

interface TmClassification {
  segment?: { name?: string }
  genre?: { name?: string }
  subGenre?: { name?: string }
}

interface TmEvent {
  id: string
  name?: string
  url?: string
  info?: string
  description?: string
  dates?: {
    start?: {
      dateTime?: string
      localDate?: string
      localTime?: string
      dateTBD?: boolean
      timeTBD?: boolean
      noSpecificTime?: boolean
    }
    end?: {
      dateTime?: string
      localDate?: string
    }
  }
  images?: TmImage[]
  priceRanges?: TmPriceRange[]
  classifications?: TmClassification[]
  _embedded?: {
    venues?: TmVenue[]
  }
  promoter?: { name?: string }
  [key: string]: unknown
}

interface TmResponse {
  _embedded?: {
    events?: TmEvent[]
  }
  page?: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

/**
 * Map Ticketmaster segment/genre names to our EventCategory slugs.
 * Returns undefined when no mapping is found so the categorization pass
 * can assign one automatically.
 */
function mapCategory(classifications?: TmClassification[]): string | undefined {
  const segment = classifications?.[0]?.segment?.name?.toLowerCase() ?? ''
  const genre = classifications?.[0]?.genre?.name?.toLowerCase() ?? ''

  if (segment === 'music') return 'music-concerts'
  if (segment === 'sports') return 'sports'
  if (segment === 'arts & theatre') {
    if (genre === 'comedy') return 'comedy'
    if (genre === 'theatre') return 'theater'
    if (genre === 'film') return 'arts-culture'
    return 'arts-culture'
  }
  if (segment === 'film') return 'arts-culture'
  if (segment === 'family') return 'family-kids'
  if (segment === 'miscellaneous') return undefined

  return undefined
}

// ---------------------------------------------------------------------------
// Image selection
// ---------------------------------------------------------------------------

/**
 * Prefer the largest 16:9 image; fall back to the largest image overall.
 */
function pickBestImage(images?: TmImage[]): string | undefined {
  if (!images?.length) return undefined

  const sixteenNine = images
    .filter((img) => img.ratio === '16_9' && !img.fallback)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))

  if (sixteenNine.length > 0) return sixteenNine[0].url

  const fallback = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  return fallback[0]?.url
}

// ---------------------------------------------------------------------------
// Event normalizer
// ---------------------------------------------------------------------------

function normalizeEvent(raw: TmEvent): NormalizedEvent | null {
  const id = raw.id
  if (!id) return null

  // Start date — prefer full dateTime, fall back to localDate
  const startDate =
    raw.dates?.start?.dateTime ??
    (raw.dates?.start?.localDate
      ? `${raw.dates.start.localDate}T00:00:00`
      : null)

  if (!startDate) return null

  const endDate = raw.dates?.end?.dateTime
    ?? (raw.dates?.end?.localDate
      ? `${raw.dates.end.localDate}T00:00:00`
      : undefined)

  const isAllDay =
    raw.dates?.start?.noSpecificTime === true ||
    raw.dates?.start?.timeTBD === true

  // Venue
  const venue = raw._embedded?.venues?.[0]
  const venueName = venue?.name
  const addressLine = venue?.address?.line1
  const city = venue?.city?.name
  const state = venue?.state?.stateCode
  const venueAddress = [addressLine, city, state].filter(Boolean).join(', ') || undefined
  const lat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined
  const lng = venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined

  // Price
  const ticketRange = raw.priceRanges?.[0]
  const priceMin = ticketRange?.min
  const priceMax = ticketRange?.max
  const isFree = priceMin === 0 && (priceMax === 0 || priceMax === undefined)

  // Description — Ticketmaster often has `info` instead of `description`
  const description = raw.description ?? raw.info ?? ''

  return {
    externalId: id,
    source: 'ticketmaster',
    sourceUrl: raw.url ?? `https://www.ticketmaster.com/event/${id}`,
    title: raw.name ?? 'Untitled Event',
    description,
    startDate,
    endDate,
    isAllDay,
    venueName,
    venueAddress,
    lat,
    lng,
    category: mapCategory(raw.classifications),
    tags: [],
    imageUrl: pickBestImage(raw.images),
    imageAlt: raw.name,
    priceMin,
    priceMax,
    isFree,
    ticketUrl: raw.url,
    organizerName: raw.promoter?.name,
    rawData: raw as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class TicketmasterAdapter extends EventAdapter {
  readonly source = 'ticketmaster'

  async fetch(): Promise<NormalizedEvent[]> {
    const apiKey = process.env.TICKETMASTER_API_KEY
    if (!apiKey) {
      console.warn('[Ticketmaster] TICKETMASTER_API_KEY is not set — skipping fetch.')
      return []
    }

    const now = new Date()
    const thirtyDaysOut = new Date(now)
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)

    const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
    const endDateTime = thirtyDaysOut.toISOString().replace(/\.\d{3}Z$/, 'Z')

    const events: NormalizedEvent[] = []
    let page = 0
    let totalPages = 1

    console.log('[Ticketmaster] Starting event fetch for Houston, TX...')

    while (page < totalPages) {
      const params = new URLSearchParams({
        apikey: apiKey,
        city: 'Houston',
        stateCode: 'TX',
        radius: '50',
        unit: 'miles',
        size: String(PAGE_SIZE),
        sort: 'date,asc',
        startDateTime,
        endDateTime,
        page: String(page),
      })

      const url = `${API_BASE}?${params.toString()}`

      try {
        const response = await fetch(url)

        if (!response.ok) {
          console.error(
            `[Ticketmaster] API error on page ${page}: ${response.status} ${response.statusText}`
          )
          break
        }

        const data = (await response.json()) as TmResponse

        const rawEvents = data._embedded?.events ?? []
        console.log(
          `[Ticketmaster] Page ${page + 1}/${data.page?.totalPages ?? 1}: received ${rawEvents.length} events`
        )

        for (const raw of rawEvents) {
          const normalized = normalizeEvent(raw)
          if (normalized) events.push(normalized)
        }

        totalPages = data.page?.totalPages ?? 1
        page++

        // Safety cap — Ticketmaster limits deep pagination
        if (page >= 5) break
      } catch (err) {
        console.error(`[Ticketmaster] Network error on page ${page}:`, err)
        break
      }
    }

    console.log(`[Ticketmaster] Fetch complete. Returning ${events.length} normalized events.`)
    return events
  }
}
