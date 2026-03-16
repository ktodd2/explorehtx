// =============================================================================
// ExploreHTX — Houston Museum District Adapter
// Scrapes events from the Houston Museum District website (houmuse.org).
// =============================================================================

import { createHash } from 'node:crypto'
import { EventAdapter, NormalizedEvent } from './base'

const EVENTS_URL = 'https://www.houmuse.org/events/'
const FALLBACK_URL = 'https://houmuse.org/events/'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a short, stable hash from an arbitrary string.
 * Used to build deterministic `externalId` values when the source
 * does not provide a numeric/UUID identifier.
 */
function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12)
}

/**
 * Strip HTML tags and collapse whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Attempt to parse a human-readable date string into an ISO 8601 datetime.
 * Handles common patterns found on museum sites, e.g.:
 *   "March 15, 2026"
 *   "March 15 – April 20, 2026"
 *   "Mar 15, 2026 at 7:00 PM"
 *   "03/15/2026"
 */
function parseDate(raw: string): string | undefined {
  if (!raw) return undefined

  const cleaned = raw.trim()

  // Try native Date parsing first — works for many common formats
  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  // Handle "Month Day, Year at Time" with optional AM/PM
  const longForm =
    /(\w+)\s+(\d{1,2}),?\s*(\d{4})(?:\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i
  const m = cleaned.match(longForm)
  if (m) {
    const [, month, day, year, hours, minutes, ampm] = m
    const dateStr = `${month} ${day}, ${year}`
    let d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      if (hours) {
        let h = parseInt(hours, 10)
        const min = parseInt(minutes ?? '0', 10)
        if (ampm?.toUpperCase() === 'PM' && h < 12) h += 12
        if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0
        d.setHours(h, min, 0, 0)
      }
      return d.toISOString()
    }
  }

  return undefined
}

/**
 * Extract start and end dates from a date string that may contain a range
 * separated by an en-dash, em-dash, or hyphen.
 */
function parseDateRange(raw: string): { start?: string; end?: string } {
  if (!raw) return {}

  // Split on en-dash, em-dash, or " - "
  const parts = raw.split(/\s*[–—]\s*|\s+-\s+/)
  if (parts.length >= 2) {
    const startRaw = parts[0].trim()
    let endRaw = parts[1].trim()

    // If the end part lacks a year, borrow it from the start
    if (!/\d{4}/.test(endRaw)) {
      const yearMatch = startRaw.match(/(\d{4})/)
      if (yearMatch) {
        endRaw = `${endRaw}, ${yearMatch[1]}`
      }
    }

    return {
      start: parseDate(startRaw),
      end: parseDate(endRaw),
    }
  }

  return { start: parseDate(raw) }
}

/**
 * Resolve a possibly-relative URL against the base site URL.
 */
function resolveUrl(href: string): string {
  if (!href) return ''
  if (href.startsWith('http')) return href
  const base = 'https://www.houmuse.org'
  return href.startsWith('/') ? `${base}${href}` : `${base}/${href}`
}

// ---------------------------------------------------------------------------
// HTML scraping helpers
// ---------------------------------------------------------------------------

interface RawMuseumEvent {
  title: string
  dateText: string
  venue: string
  description: string
  imageUrl: string
  eventUrl: string
}

/**
 * Extract event card blocks from the page HTML using regex patterns.
 *
 * Museum district sites commonly use <article>, <div class="event-*">,
 * or <li> elements for event listings. We try multiple patterns to be
 * resilient to minor markup changes.
 */
function extractEventCards(html: string): RawMuseumEvent[] {
  const events: RawMuseumEvent[] = []

  // ---- Strategy 1: <article> or event card blocks ----
  // Matches self-contained event blocks wrapped in <article> or event-card divs.
  const cardPatterns = [
    // <article ...>...</article>
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    // <div class="event-card...">...</div> (greedy within reason)
    /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*event|<\/section|<\/main|$)/gi,
    // <li class="...event...">...</li>
    /<li[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    // WordPress tribe events
    /<div[^>]*class="[^"]*tribe_events[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*tribe_events|<\/section|<\/main|$)/gi,
  ]

  for (const pattern of cardPatterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(html)) !== null) {
      const block = match[1] ?? match[0]
      const event = parseEventBlock(block)
      if (event) events.push(event)
    }
    if (events.length > 0) break // Use the first pattern that yields results
  }

  // ---- Strategy 2: structured data (JSON-LD) ----
  if (events.length === 0) {
    const jsonLdPattern =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let jsonMatch: RegExpExecArray | null
    while ((jsonMatch = jsonLdPattern.exec(html)) !== null) {
      try {
        const data = JSON.parse(jsonMatch[1])
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (item['@type'] === 'Event' || item['@type']?.includes?.('Event')) {
            events.push({
              title: item.name ?? '',
              dateText: item.startDate ?? '',
              venue:
                typeof item.location === 'string'
                  ? item.location
                  : item.location?.name ?? '',
              description:
                item.description ?? '',
              imageUrl:
                typeof item.image === 'string'
                  ? item.image
                  : item.image?.url ?? '',
              eventUrl: item.url ?? '',
            })
          }
        }
      } catch {
        // Malformed JSON-LD — skip
      }
    }
  }

  return events
}

/**
 * Parse an individual event card HTML block into a RawMuseumEvent.
 */
function parseEventBlock(block: string): RawMuseumEvent | null {
  // Title — look for heading tags or prominent links
  const titleMatch =
    block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) ??
    block.match(/<a[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ??
    block.match(/<[^>]*class="[^"]*event[_-]?title[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)

  const title = titleMatch ? stripHtml(titleMatch[1]) : ''
  if (!title) return null

  // Event URL — first <a href> in the block, or the one wrapping the title
  const urlMatch =
    block.match(/<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/i) ??
    block.match(/href=["']([^"']+)["']/i)
  const eventUrl = urlMatch ? resolveUrl(urlMatch[1]) : ''

  // Date text — look for <time>, date classes, or common date patterns
  const dateMatch =
    block.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i) ??
    block.match(/<time[^>]*>([\s\S]*?)<\/time>/i) ??
    block.match(/<[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i) ??
    block.match(
      /(\w+\s+\d{1,2},?\s*\d{4}(?:\s*[–—-]\s*\w+\s+\d{1,2},?\s*\d{4})?)/i
    )
  const dateText = dateMatch ? stripHtml(dateMatch[1]) : ''

  // Venue / museum name
  const venueMatch =
    block.match(/<[^>]*class="[^"]*venue[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i) ??
    block.match(/<[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i) ??
    block.match(/<[^>]*class="[^"]*museum[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)
  const venue = venueMatch ? stripHtml(venueMatch[1]) : ''

  // Description
  const descMatch =
    block.match(/<[^>]*class="[^"]*desc[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i) ??
    block.match(/<[^>]*class="[^"]*excerpt[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i) ??
    block.match(/<[^>]*class="[^"]*summary[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i) ??
    block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const description = descMatch ? stripHtml(descMatch[1]) : ''

  // Image
  const imgMatch =
    block.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i) ??
    block.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i)
  const imageUrl = imgMatch ? resolveUrl(imgMatch[1]) : ''

  return { title, dateText, venue, description, imageUrl, eventUrl }
}

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeMuseumEvent(raw: RawMuseumEvent): NormalizedEvent | null {
  if (!raw.title) return null

  // Build a stable external ID from the event URL when available,
  // otherwise fall back to title + date.
  const idSource = raw.eventUrl || `${raw.title}::${raw.dateText}`
  const externalId = `museum-district-${shortHash(idSource)}`

  const { start, end } = parseDateRange(raw.dateText)

  // If we can't parse a start date, fall back to today (exhibition listings
  // sometimes omit dates when they're ongoing).
  const startDate = start ?? new Date().toISOString()

  // Museum events without specific times are typically all-day
  const isAllDay = !raw.dateText.match(/\d{1,2}:\d{2}/i)

  return {
    externalId,
    source: 'museum-district',
    sourceUrl: raw.eventUrl || EVENTS_URL,
    title: raw.title,
    description: raw.description,
    startDate,
    endDate: end,
    isAllDay,
    venueName: raw.venue || undefined,
    category: 'arts-culture',
    tags: ['museum', 'houston-museum-district'],
    imageUrl: raw.imageUrl || undefined,
    imageAlt: raw.title,
    isFree: undefined, // Museum admission varies; leave to downstream enrichment
    organizerName: raw.venue || 'Houston Museum District',
    rawData: raw as unknown as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class MuseumDistrictAdapter extends EventAdapter {
  readonly source = 'museum-district'

  async fetch(): Promise<NormalizedEvent[]> {
    console.log('[MuseumDistrict] Starting event scrape from houmuse.org...')

    const html = await this.fetchPage()
    if (!html) return []

    const rawEvents = extractEventCards(html)
    console.log(
      `[MuseumDistrict] Extracted ${rawEvents.length} raw event cards from page.`
    )

    const events: NormalizedEvent[] = []
    for (const raw of rawEvents) {
      const normalized = normalizeMuseumEvent(raw)
      if (normalized) events.push(normalized)
    }

    console.log(
      `[MuseumDistrict] Fetch complete. Returning ${events.length} normalized events.`
    )
    return events
  }

  /**
   * Attempt to fetch the events page HTML. Tries the primary URL first,
   * then falls back to the alternate domain.
   */
  private async fetchPage(): Promise<string | null> {
    for (const url of [EVENTS_URL, FALLBACK_URL]) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'ExploreHTX/1.0 (https://explorehtx.com; events aggregator)',
            Accept: 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(15_000),
        })

        if (!response.ok) {
          console.warn(
            `[MuseumDistrict] HTTP ${response.status} from ${url} — trying fallback.`
          )
          continue
        }

        const html = await response.text()
        console.log(
          `[MuseumDistrict] Fetched ${html.length} bytes from ${url}.`
        )
        return html
      } catch (err) {
        console.warn(`[MuseumDistrict] Failed to fetch ${url}:`, err)
      }
    }

    console.error(
      '[MuseumDistrict] Could not fetch events page from any URL.'
    )
    return null
  }
}
