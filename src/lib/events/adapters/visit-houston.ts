// =============================================================================
// ExploreHTX — Visit Houston Adapter
// Scrapes events from the official Houston tourism board website.
// Extracts JSON-LD structured data when available, falls back to HTML parsing.
// =============================================================================

import { createHash } from 'node:crypto'
import { EventAdapter, NormalizedEvent } from './base'

const BASE_URL = 'https://www.visithoustontexas.com/events/'
const MAX_PAGES = 10
const SOURCE = 'visithouston'

// ---------------------------------------------------------------------------
// JSON-LD shapes (Schema.org Event, partial)
// ---------------------------------------------------------------------------

interface JsonLdLocation {
  '@type'?: string
  name?: string
  address?: string | {
    '@type'?: string
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  geo?: {
    '@type'?: string
    latitude?: number | string
    longitude?: number | string
  }
}

interface JsonLdOffer {
  '@type'?: string
  price?: number | string
  priceCurrency?: string
  url?: string
  availability?: string
}

interface JsonLdEvent {
  '@type'?: string
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  url?: string
  image?: string | string[] | { url?: string; contentUrl?: string }
  location?: JsonLdLocation | JsonLdLocation[]
  organizer?: { name?: string; '@type'?: string } | string
  offers?: JsonLdOffer | JsonLdOffer[]
  performer?: { name?: string } | { name?: string }[]
  eventAttendanceMode?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Parsed HTML event card
// ---------------------------------------------------------------------------

interface ParsedCard {
  title: string
  url: string
  date?: string
  venue?: string
  imageUrl?: string
  description?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a stable, deterministic external ID from a string key.
 */
function stableId(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 16)
}

/**
 * Resolve a possibly-relative URL against the Visit Houston domain.
 */
function resolveUrl(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  const base = 'https://www.visithoustontexas.com'
  return href.startsWith('/') ? `${base}${href}` : `${base}/${href}`
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Attempt to parse a human-readable date string into ISO 8601.
 * Returns the original string if parsing fails so downstream
 * consumers can still display it.
 */
function parseDate(raw: string): string {
  // Already ISO 8601
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw

  const attempt = new Date(raw)
  if (!isNaN(attempt.getTime())) return attempt.toISOString()

  // Return raw as-is — at least it carries human-readable info
  return raw
}

/**
 * Extract the first image URL from a JSON-LD image field.
 */
function extractImage(
  img: string | string[] | { url?: string; contentUrl?: string } | undefined
): string | undefined {
  if (!img) return undefined
  if (typeof img === 'string') return img
  if (Array.isArray(img)) return img[0]
  return img.url ?? img.contentUrl
}

/**
 * Build a venue address string from a JSON-LD address field.
 */
function buildAddress(
  addr: JsonLdLocation['address']
): string | undefined {
  if (!addr) return undefined
  if (typeof addr === 'string') return addr
  const parts = [
    addr.streetAddress,
    addr.addressLocality,
    addr.addressRegion,
    addr.postalCode,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * Parse price info from JSON-LD offers.
 */
function parseOffers(
  offers: JsonLdOffer | JsonLdOffer[] | undefined
): { priceMin?: number; priceMax?: number; isFree?: boolean; ticketUrl?: string } {
  if (!offers) return {}
  const list = Array.isArray(offers) ? offers : [offers]

  let priceMin: number | undefined
  let priceMax: number | undefined
  let ticketUrl: string | undefined

  for (const offer of list) {
    const p = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price
    if (p != null && !isNaN(p)) {
      if (priceMin === undefined || p < priceMin) priceMin = p
      if (priceMax === undefined || p > priceMax) priceMax = p
    }
    if (offer.url && !ticketUrl) ticketUrl = offer.url
  }

  const isFree = priceMin === 0 && (priceMax === undefined || priceMax === 0)

  return { priceMin, priceMax, isFree, ticketUrl }
}

// ---------------------------------------------------------------------------
// JSON-LD extraction
// ---------------------------------------------------------------------------

/**
 * Find all `<script type="application/ld+json">` blocks and return
 * any objects whose `@type` includes "Event".
 */
function extractJsonLdEvents(html: string): JsonLdEvent[] {
  const events: JsonLdEvent[] = []
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of items) {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const type = String(obj['@type'] ?? '')

          // Handle @graph arrays
          if (obj['@graph'] && Array.isArray(obj['@graph'])) {
            for (const node of obj['@graph']) {
              if (node && typeof node === 'object') {
                const nodeType = String((node as Record<string, unknown>)['@type'] ?? '')
                if (nodeType.toLowerCase().includes('event')) {
                  events.push(node as JsonLdEvent)
                }
              }
            }
          }

          if (type.toLowerCase().includes('event')) {
            events.push(obj as JsonLdEvent)
          }
        }
      }
    } catch {
      // Malformed JSON-LD — skip
    }
  }

  return events
}

/**
 * Normalize a JSON-LD Event object into a NormalizedEvent.
 */
function normalizeJsonLdEvent(raw: JsonLdEvent): NormalizedEvent | null {
  const title = raw.name?.trim()
  if (!title) return null

  const startDate = raw.startDate
  if (!startDate) return null

  const sourceUrl = raw.url ? resolveUrl(raw.url) : BASE_URL
  const externalId = stableId(raw.url ?? `${title}::${startDate}`)

  const location = Array.isArray(raw.location) ? raw.location[0] : raw.location
  const venueName = location?.name
  const venueAddress = buildAddress(location?.address)
  const lat = location?.geo?.latitude != null ? Number(location.geo.latitude) : undefined
  const lng = location?.geo?.longitude != null ? Number(location.geo.longitude) : undefined

  const imageUrl = extractImage(raw.image)
  const { priceMin, priceMax, isFree, ticketUrl } = parseOffers(raw.offers)

  const organizerName =
    typeof raw.organizer === 'string'
      ? raw.organizer
      : raw.organizer?.name

  return {
    externalId,
    source: SOURCE,
    sourceUrl,
    title,
    description: raw.description ? stripHtml(raw.description) : '',
    startDate: parseDate(startDate),
    endDate: raw.endDate ? parseDate(raw.endDate) : undefined,
    venueName,
    venueAddress,
    lat: lat && !isNaN(lat) ? lat : undefined,
    lng: lng && !isNaN(lng) ? lng : undefined,
    imageUrl,
    imageAlt: title,
    priceMin,
    priceMax,
    isFree,
    ticketUrl,
    organizerName,
    rawData: raw as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// HTML fallback parsing
// ---------------------------------------------------------------------------

/**
 * Parse event listing cards from the HTML when no JSON-LD is available.
 * Uses regex patterns targeting common tourism site markup.
 */
function parseEventCards(html: string): ParsedCard[] {
  const cards: ParsedCard[] = []

  // Strategy 1: Look for article/div blocks with event card patterns
  // Common patterns: <div class="...event..."> or <article>
  const cardRegex =
    /<(?:article|div|li)[^>]*class="[^"]*(?:event|listing|card)[^"]*"[^>]*>([\s\S]*?)(?:<\/(?:article|div|li)>)/gi
  let cardMatch: RegExpExecArray | null

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const block = cardMatch[1]
    const card = extractCardFields(block)
    if (card) cards.push(card)
  }

  // Strategy 2: If no cards found, try anchor-based listing patterns
  if (cards.length === 0) {
    const linkRegex =
      /<a[^>]+href=["']([^"']*\/events\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let linkMatch: RegExpExecArray | null
    const seen = new Set<string>()

    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = linkMatch[1]
      if (seen.has(href)) continue
      seen.add(href)

      const innerHtml = linkMatch[2]
      const titleMatch = innerHtml.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i)
      const title = titleMatch ? stripHtml(titleMatch[1]) : stripHtml(innerHtml)

      if (!title || title.length < 3 || title.length > 300) continue

      const imgMatch = innerHtml.match(/<img[^>]+src=["']([^"']+)["']/i)

      cards.push({
        title,
        url: resolveUrl(href),
        imageUrl: imgMatch ? resolveUrl(imgMatch[1]) : undefined,
      })
    }
  }

  // Strategy 3: Broad heading + link scan
  if (cards.length === 0) {
    const headingRegex =
      /<h[2-4][^>]*>\s*<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h[2-4]>/gi
    let headingMatch: RegExpExecArray | null

    while ((headingMatch = headingRegex.exec(html)) !== null) {
      const href = headingMatch[1]
      const title = stripHtml(headingMatch[2])
      if (!title || title.length < 3) continue

      cards.push({
        title,
        url: resolveUrl(href),
      })
    }
  }

  return cards
}

/**
 * Extract title, date, venue, image, and link from an event card HTML block.
 */
function extractCardFields(block: string): ParsedCard | null {
  // Title: look for h2/h3/h4 or a strong link
  const titleMatch =
    block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i) ??
    block.match(/<a[^>]+class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
  const title = titleMatch ? stripHtml(titleMatch[1]) : undefined
  if (!title || title.length < 3) return null

  // Link
  const linkMatch = block.match(/<a[^>]+href=["']([^"']+)["']/i)
  const url = linkMatch ? resolveUrl(linkMatch[1]) : BASE_URL

  // Date: <time> element, or date-class spans
  const timeMatch =
    block.match(/<time[^>]*datetime=["']([^"']+)["']/i) ??
    block.match(/<time[^>]*>([\s\S]*?)<\/time>/i) ??
    block.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
  const date = timeMatch ? stripHtml(timeMatch[1]) : undefined

  // Venue
  const venueMatch =
    block.match(/<span[^>]*class="[^"]*(?:venue|location)[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ??
    block.match(/<div[^>]*class="[^"]*(?:venue|location)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  const venue = venueMatch ? stripHtml(venueMatch[1]) : undefined

  // Image
  const imgMatch =
    block.match(/<img[^>]+src=["']([^"']+)["']/i) ??
    block.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i)
  const imageUrl = imgMatch ? resolveUrl(imgMatch[1]) : undefined

  // Description snippet
  const descMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const description = descMatch ? stripHtml(descMatch[1]) : undefined

  return { title, url, date, venue, imageUrl, description }
}

/**
 * Convert a parsed HTML card into a NormalizedEvent.
 */
function normalizeCard(card: ParsedCard): NormalizedEvent {
  const externalId = stableId(card.url !== BASE_URL ? card.url : `${card.title}::${card.date ?? ''}`)

  return {
    externalId,
    source: SOURCE,
    sourceUrl: card.url,
    title: card.title,
    description: card.description ?? '',
    startDate: card.date ? parseDate(card.date) : '',
    venueName: card.venue,
    imageUrl: card.imageUrl,
    imageAlt: card.title,
    rawData: card as unknown as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Detect the next page URL from pagination links.
 * Looks for common patterns: ?page=N, rel="next", aria-label="next", etc.
 */
function findNextPageUrl(html: string, currentPage: number): string | null {
  // rel="next"
  const relNext = html.match(/<a[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i)
  if (relNext) return resolveUrl(relNext[1])

  // aria-label containing "next"
  const ariaNext = html.match(/<a[^>]+aria-label=["'][^"']*next[^"']*["'][^>]+href=["']([^"']+)["']/i)
  if (ariaNext) return resolveUrl(ariaNext[1])

  // Link text "Next" / "Next Page" / ">"
  const textNext = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>\s*(?:Next|&gt;|›|»)\s*<\/a>/i)
  if (textNext) return resolveUrl(textNext[1])

  // Explicit ?page=N pattern — look for the next page number
  const nextPage = currentPage + 1
  const pageParam = html.match(
    new RegExp(`<a[^>]+href=["']([^"']*[?&]page=${nextPage}[^"']*)["']`, 'i')
  )
  if (pageParam) return resolveUrl(pageParam[1])

  return null
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class VisitHoustonAdapter extends EventAdapter {
  readonly source = SOURCE

  async fetch(): Promise<NormalizedEvent[]> {
    const allEvents: NormalizedEvent[] = []
    let pageUrl: string | null = BASE_URL
    let pageNum = 1

    console.log('[VisitHouston] Starting event scrape...')

    while (pageUrl && pageNum <= MAX_PAGES) {
      try {
        console.log(`[VisitHouston] Fetching page ${pageNum}: ${pageUrl}`)

        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; ExploreHTX/1.0; +https://explorehtx.com)',
            Accept: 'text/html,application/xhtml+xml',
          },
        })

        if (!response.ok) {
          console.error(
            `[VisitHouston] HTTP ${response.status} ${response.statusText} on page ${pageNum}`
          )
          break
        }

        const html = await response.text()

        // ----- Try JSON-LD first -----
        const jsonLdEvents = extractJsonLdEvents(html)

        if (jsonLdEvents.length > 0) {
          console.log(
            `[VisitHouston] Page ${pageNum}: found ${jsonLdEvents.length} JSON-LD events`
          )

          for (const raw of jsonLdEvents) {
            const normalized = normalizeJsonLdEvent(raw)
            if (normalized) allEvents.push(normalized)
          }
        } else {
          // ----- Fallback: parse HTML cards -----
          const cards = parseEventCards(html)
          console.log(
            `[VisitHouston] Page ${pageNum}: parsed ${cards.length} event cards from HTML`
          )

          for (const card of cards) {
            allEvents.push(normalizeCard(card))
          }
        }

        // ----- Pagination -----
        pageUrl = findNextPageUrl(html, pageNum)
        pageNum++
      } catch (err) {
        console.error(`[VisitHouston] Error on page ${pageNum}:`, err)
        break
      }
    }

    console.log(
      `[VisitHouston] Scrape complete. Returning ${allEvents.length} normalized events.`
    )
    return allEvents
  }
}
