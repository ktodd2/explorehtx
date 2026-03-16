// =============================================================================
// ExploreHTX — Meetup Adapter
// Fetches events from the Meetup public GraphQL API for the Houston metro area.
// No API key required — uses the public endpoint.
// =============================================================================

import { EventAdapter, NormalizedEvent } from './base'

const GRAPHQL_ENDPOINT = 'https://www.meetup.com/gql'

// Houston, TX coordinates
const HOUSTON_LAT = 29.7604
const HOUSTON_LNG = -95.3698
// 50 miles in meters
const RADIUS_METERS = 80467
const MAX_EVENTS = 200

// ---------------------------------------------------------------------------
// Meetup GraphQL response shapes
// ---------------------------------------------------------------------------

interface MeetupVenue {
  name?: string
  address?: string
  city?: string
  state?: string
  lat?: number
  lng?: number
}

interface MeetupGroup {
  name?: string
  urlname?: string
}

interface MeetupFeaturedPhoto {
  highResUrl?: string
}

interface MeetupFeeSettings {
  amount?: number
  currency?: string
}

interface MeetupEventNode {
  id: string
  title?: string
  description?: string
  dateTime?: string
  endTime?: string
  eventUrl?: string
  going?: number
  isOnline?: boolean
  venue?: MeetupVenue
  group?: MeetupGroup
  featuredEventPhoto?: MeetupFeaturedPhoto
  feeSettings?: MeetupFeeSettings
  topics?: MeetupTopic[]
  [key: string]: unknown
}

interface MeetupTopic {
  name?: string
  urlkey?: string
}

interface MeetupEdge {
  node: MeetupEventNode
}

interface MeetupRankedEvents {
  count?: number
  edges?: MeetupEdge[]
}

interface MeetupGraphQLResponse {
  data?: {
    rankedEvents?: MeetupRankedEvents
  }
  errors?: Array<{ message: string }>
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

function buildQuery(startDate: string, endDate: string): string {
  return `
    query ($filter: RankedEventsFilter!, $first: Int) {
      rankedEvents(filter: $filter, input: { first: $first }) {
        count
        edges {
          node {
            id
            title
            description
            dateTime
            endTime
            eventUrl
            going
            isOnline
            venue {
              name
              address
              city
              state
              lat
              lng
            }
            group {
              name
              urlname
            }
            featuredEventPhoto {
              highResUrl
            }
            feeSettings {
              amount
              currency
            }
          }
        }
      }
    }
  `
}

function buildVariables(startDate: string, endDate: string) {
  return {
    filter: {
      lat: HOUSTON_LAT,
      lon: HOUSTON_LNG,
      radius: RADIUS_METERS,
      startDateRange: startDate,
      endDateRange: endDate,
    },
    first: MAX_EVENTS,
  }
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

/**
 * Map common Meetup group/event topic keywords to our EventCategory slugs.
 * Meetup events rely on topic tags rather than a single category, so we scan
 * the title, description, and topic list for recognizable keywords.
 */
function mapCategory(
  event: MeetupEventNode
): string | undefined {
  const topics = (event.topics ?? []).map((t) => (t.name ?? t.urlkey ?? '').toLowerCase())
  const haystack = [
    event.title ?? '',
    ...topics,
  ]
    .join(' ')
    .toLowerCase()

  if (/\bmusic\b|concert|live band|dj set/.test(haystack)) return 'music-concerts'
  if (/\bcomedy\b|stand-up|improv|open mic/.test(haystack)) return 'comedy'
  if (/\btheater\b|\btheatre\b|broadway|stage show/.test(haystack)) return 'theater'
  if (/\bsport\b|\bfitness\b|\brun\b|\byoga\b|\bcycling\b|\bworkout\b/.test(haystack)) return 'sports'
  if (/\bfood\b|\bdining\b|\bcooking\b|\bbrunch\b|\bbbq\b|\bfoodie\b/.test(haystack)) return 'food-dining'
  if (/\bart\b|\barts\b|\bculture\b|\bgallery\b|\bmuseum\b|\bpainting\b/.test(haystack)) return 'arts-culture'
  if (/\bnightlife\b|\bhappy hour\b|\bbar crawl\b|\bnight out\b/.test(haystack)) return 'nightlife'
  if (/\bfamily\b|\bkids\b|\bchildren\b|\bparenting\b/.test(haystack)) return 'family-kids'
  if (/\boutdoor\b|\bhiking\b|\bnature\b|\bpark\b|\btrail\b|\bcamping\b/.test(haystack)) return 'outdoor-parks'
  if (/\bfestival\b|\bfair\b|\bcelebration\b/.test(haystack)) return 'festivals'
  if (/\bmarket\b|\bshopping\b|\bflea\b|\bvintage\b|\bcraft fair\b/.test(haystack)) return 'markets-shopping'
  if (/\btech\b|\bcoding\b|\bprogramming\b|\bsoftware\b|\bdevops\b|\bai\b|\bdata\b|\bstartup\b/.test(haystack)) return 'community'
  if (/\bnetworking\b|\bmeetup\b|\bsocial\b|\bcommunity\b/.test(haystack)) return 'community'

  return undefined
}

// ---------------------------------------------------------------------------
// Event normalizer
// ---------------------------------------------------------------------------

function normalizeEvent(node: MeetupEventNode): NormalizedEvent | null {
  if (!node.id) return null

  const startDate = node.dateTime
  if (!startDate) return null

  const venue = node.venue
  const venueAddress = [venue?.address, venue?.city, venue?.state]
    .filter(Boolean)
    .join(', ') || undefined

  // Determine pricing — feeSettings.amount > 0 means paid
  const fee = node.feeSettings?.amount
  const isFree = fee === undefined || fee === null || fee === 0
  const priceMin = isFree ? 0 : fee
  const priceMax = isFree ? 0 : fee

  const eventUrl = node.eventUrl ?? `https://www.meetup.com/events/${node.id}`

  return {
    externalId: node.id,
    source: 'meetup',
    sourceUrl: eventUrl,
    title: node.title ?? 'Untitled Event',
    description: node.description ?? '',
    startDate,
    endDate: node.endTime,
    venueName: venue?.name,
    venueAddress,
    lat: venue?.lat,
    lng: venue?.lng,
    category: mapCategory(node),
    tags: (node.topics ?? [])
      .map((t) => t.name ?? t.urlkey)
      .filter((t): t is string => Boolean(t)),
    imageUrl: node.featuredEventPhoto?.highResUrl,
    imageAlt: node.title,
    priceMin,
    priceMax,
    isFree,
    ticketUrl: eventUrl,
    organizerName: node.group?.name,
    rawData: node as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class MeetupAdapter extends EventAdapter {
  readonly source = 'meetup'

  async fetch(): Promise<NormalizedEvent[]> {
    console.log('[Meetup] Starting event fetch for Houston metro area...')

    // Date range: from now through 60 days ahead
    const now = new Date()
    const startDate = now.toISOString()
    const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const endDate = futureDate.toISOString()

    const query = buildQuery(startDate, endDate)
    const variables = buildVariables(startDate, endDate)

    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      })

      if (!response.ok) {
        console.error(
          `[Meetup] API error: ${response.status} ${response.statusText}`
        )
        return []
      }

      const json = (await response.json()) as MeetupGraphQLResponse

      if (json.errors?.length) {
        console.error(
          '[Meetup] GraphQL errors:',
          json.errors.map((e) => e.message).join('; ')
        )
        return []
      }

      const edges = json.data?.rankedEvents?.edges ?? []
      const totalCount = json.data?.rankedEvents?.count ?? edges.length

      console.log(
        `[Meetup] Received ${edges.length} events (total available: ${totalCount})`
      )

      const events: NormalizedEvent[] = []

      for (const edge of edges) {
        const normalized = normalizeEvent(edge.node)
        if (normalized) events.push(normalized)
      }

      console.log(
        `[Meetup] Fetch complete. Returning ${events.length} normalized events.`
      )
      return events
    } catch (err) {
      console.error('[Meetup] Network error:', err)
      return []
    }
  }
}
