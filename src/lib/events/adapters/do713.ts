// =============================================================================
// ExploreHTX — Do713 Adapter
// Scrapes events from Do713.com, a popular Houston events aggregator.
// Uses regex-based HTML parsing to extract event listings.
// =============================================================================

import { EventAdapter, NormalizedEvent } from './base'

const BASE_URL = 'https://do713.com'

// ---------------------------------------------------------------------------
// Date range URLs to scrape
// ---------------------------------------------------------------------------

/**
 * Build an array of Do713 URLs covering the next 30 days.
 * Do713 supports date-based URLs like /events/YYYY-MM-DD.
 */
function buildDateUrls(): string[] {
  const urls: string[] = []
  const now = new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    urls.push(`${BASE_URL}/events/${yyyy}-${mm}-${dd}`)
  }

  return urls
}

// ---------------------------------------------------------------------------
// Stable ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a stable hash-based external ID from one or more strings.
 * Uses a simple djb2-style hash to avoid crypto dependencies.
 */
function generateStableId(...parts: string[]): string {
  const input = parts.join('|')
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + charCode
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0
  }
  return `do713-${hash.toString(36)}`
}

// ---------------------------------------------------------------------------
// HTML entity decoding
// ---------------------------------------------------------------------------

/**
 * Decode common HTML entities to their text equivalents.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
}

/**
 * Strip all HTML tags from a string, returning plain text.
 */
function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
}

// ---------------------------------------------------------------------------
// Raw scraped event shape
// ---------------------------------------------------------------------------

interface ScrapedEvent {
  title: string
  eventUrl: string
  dateText: string
  venueName?: string
  venueAddress?: string
  imageUrl?: string
  description?: string
}

// ---------------------------------------------------------------------------
// HTML parsing — event list pages
// ---------------------------------------------------------------------------

/**
 * Extract event data from a Do713 listing page HTML string.
 *
 * Do713 renders event cards in various markup patterns. We use multiple
 * regex strategies to maximize extraction across page redesigns.
 */
function parseEventListings(html: string, pageDate: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = []
  const seen = new Set<string>()

  // Strategy 1: Look for event card containers with links and titles
  // Matches patterns like <a href="/events/..." ...> containing title text
  const eventLinkPattern =
    /<a[^>]+href=["'](\/events\/\d{4}-\d{2}-\d{2}\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

  let linkMatch: RegExpExecArray | null
  while ((linkMatch = eventLinkPattern.exec(html)) !== null) {
    const eventPath = linkMatch[1]
    const innerHtml = linkMatch[2]

    if (seen.has(eventPath)) continue
    seen.add(eventPath)

    // Extract title from inner HTML — look for heading tags or strong text
    let title = ''
    const headingMatch = innerHtml.match(/<(?:h[1-6]|strong)[^>]*>([\s\S]*?)<\/(?:h[1-6]|strong)>/i)
    if (headingMatch) {
      title = stripHtml(headingMatch[1])
    } else {
      // Fall back to stripping all tags
      title = stripHtml(innerHtml)
    }

    if (!title || title.length < 3) continue

    const eventUrl = `${BASE_URL}${eventPath}`

    // Try to extract image from nearby context (within ~2000 chars before/after link)
    const linkPos = linkMatch.index
    const context = html.substring(Math.max(0, linkPos - 1000), linkPos + linkMatch[0].length + 1000)
    const imageUrl = extractImageUrl(context)

    events.push({
      title,
      eventUrl,
      dateText: pageDate,
      imageUrl,
    })
  }

  // Strategy 2: Look for structured event blocks with class names containing "event"
  const eventBlockPattern =
    /<(?:div|article|li|section)[^>]+class=["'][^"']*event[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi

  let blockMatch: RegExpExecArray | null
  while ((blockMatch = eventBlockPattern.exec(html)) !== null) {
    const block = blockMatch[1]

    // Extract link
    const linkInBlock = block.match(/<a[^>]+href=["'](\/events\/[^"']+)["']/i)
    if (!linkInBlock) continue

    const eventPath = linkInBlock[1]
    if (seen.has(eventPath)) continue
    seen.add(eventPath)

    // Extract title
    let title = ''
    const titleMatch = block.match(/<(?:h[1-6])[^>]*>([\s\S]*?)<\/(?:h[1-6])>/i)
    if (titleMatch) {
      title = stripHtml(titleMatch[1])
    } else {
      // Try link text
      const linkTextMatch = block.match(/<a[^>]+href=["']\/events\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i)
      if (linkTextMatch) {
        title = stripHtml(linkTextMatch[1])
      }
    }

    if (!title || title.length < 3) continue

    const eventUrl = `${BASE_URL}${eventPath}`

    // Extract venue
    const venueMatch = block.match(
      /(?:venue|location|place)[^>]*>([^<]+)/i
    )
    const venueName = venueMatch ? stripHtml(venueMatch[1]) : undefined

    // Extract time/date text
    const timeMatch = block.match(
      /<time[^>]*(?:datetime=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/time>/i
    )
    const dateText = timeMatch?.[1] ?? timeMatch?.[2] ? stripHtml(timeMatch![2]) : pageDate

    // Extract image
    const imageUrl = extractImageUrl(block)

    events.push({
      title,
      eventUrl,
      dateText,
      venueName,
      imageUrl,
    })
  }

  // Strategy 3: Generic link-based extraction as a fallback
  // Look for any links to event detail pages
  const genericLinkPattern =
    /<a[^>]+href=["'](\/events\/[^"']+\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi

  let genericMatch: RegExpExecArray | null
  while ((genericMatch = genericLinkPattern.exec(html)) !== null) {
    const eventPath = genericMatch[1]
    if (seen.has(eventPath)) continue

    // Skip non-event links (pagination, filters, etc.)
    if (/\/(page|filter|category|tag)\//i.test(eventPath)) continue

    seen.add(eventPath)

    const title = stripHtml(genericMatch[2])
    if (!title || title.length < 3) continue

    events.push({
      title,
      eventUrl: `${BASE_URL}${eventPath}`,
      dateText: pageDate,
    })
  }

  return events
}

// ---------------------------------------------------------------------------
// Detail page parsing
// ---------------------------------------------------------------------------

/**
 * Parse additional details from a Do713 event detail page.
 * Returns partial fields to merge into the scraped event.
 */
function parseEventDetail(html: string): Partial<ScrapedEvent> {
  const result: Partial<ScrapedEvent> = {}

  // Description — look for meta description or structured content
  const metaDescMatch = html.match(
    /<meta[^>]+(?:name=["']description["']|property=["']og:description["'])[^>]+content=["']([^"']+)["']/i
  )
  if (metaDescMatch) {
    result.description = decodeHtmlEntities(metaDescMatch[1])
  }

  // Try to find description in the page body
  if (!result.description) {
    const descBlockMatch = html.match(
      /<(?:div|p|section)[^>]+class=["'][^"']*(?:description|details|info|about|summary)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|section)>/i
    )
    if (descBlockMatch) {
      result.description = stripHtml(descBlockMatch[1]).substring(0, 2000)
    }
  }

  // Venue name
  const venueMatch = html.match(
    /<(?:span|div|a|p)[^>]+class=["'][^"']*venue[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|a|p)>/i
  )
  if (venueMatch) {
    result.venueName = stripHtml(venueMatch[1])
  }

  // Venue from structured data
  if (!result.venueName) {
    const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1])
        if (ld.location?.name) result.venueName = ld.location.name
        if (ld.location?.address) {
          const addr = ld.location.address
          if (typeof addr === 'string') {
            result.venueAddress = addr
          } else if (addr.streetAddress) {
            result.venueAddress = [addr.streetAddress, addr.addressLocality, addr.addressRegion]
              .filter(Boolean)
              .join(', ')
          }
        }
        if (ld.description && !result.description) {
          result.description = ld.description
        }
      } catch {
        // JSON-LD parse failure — not critical
      }
    }
  }

  // Venue address
  if (!result.venueAddress) {
    const addressMatch = html.match(
      /<(?:span|div|p|address)[^>]+class=["'][^"']*(?:address|location)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p|address)>/i
    )
    if (addressMatch) {
      result.venueAddress = stripHtml(addressMatch[1])
    }
  }

  // Image from og:image
  const ogImageMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  )
  if (ogImageMatch) {
    result.imageUrl = ogImageMatch[1]
  }

  return result
}

// ---------------------------------------------------------------------------
// Image URL extraction helper
// ---------------------------------------------------------------------------

/**
 * Extract the most likely event image URL from an HTML fragment.
 */
function extractImageUrl(html: string): string | undefined {
  // Prefer img tags with src
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+(?:\.(?:jpg|jpeg|png|webp|gif))[^"']*)["']/i)
  if (imgMatch) return resolveUrl(imgMatch[1])

  // Try data-src (lazy loaded images)
  const lazySrcMatch = html.match(/<img[^>]+data-src=["']([^"']+)["']/i)
  if (lazySrcMatch) return resolveUrl(lazySrcMatch[1])

  // Try background-image in style attributes
  const bgMatch = html.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i)
  if (bgMatch) return resolveUrl(bgMatch[1])

  // Any img src as last resort
  const anyImgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (anyImgMatch) return resolveUrl(anyImgMatch[1])

  return undefined
}

/**
 * Resolve a potentially relative URL against the Do713 base URL.
 */
function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${BASE_URL}${url}`
  return `${BASE_URL}/${url}`
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

/**
 * Parse a date string from Do713 into an ISO 8601 datetime string.
 * Handles formats like "2025-03-15", "March 15, 2025", "Sat Mar 15", etc.
 */
function parseDate(dateText: string, fallbackDate: string): string {
  // If already in YYYY-MM-DD format, use directly
  const isoMatch = dateText.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return `${isoMatch[1]}T00:00:00`

  // Try to extract a time
  const timeMatch = dateText.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?/)
  let hours = 0
  let minutes = 0
  let hasTime = false

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10)
    minutes = parseInt(timeMatch[2], 10)
    const ampm = timeMatch[3]?.toLowerCase()
    if (ampm === 'pm' && hours < 12) hours += 12
    if (ampm === 'am' && hours === 12) hours = 0
    hasTime = true
  }

  // Use the fallback date (from the URL, which is YYYY-MM-DD)
  const timePart = hasTime
    ? `T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
    : 'T00:00:00'

  return `${fallbackDate}${timePart}`
}

// ---------------------------------------------------------------------------
// Page fetcher with retry
// ---------------------------------------------------------------------------

/**
 * Fetch a page with basic retry logic and a polite delay.
 */
async function fetchPage(url: string): Promise<string | null> {
  const MAX_RETRIES = 2

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; ExploreHTX/1.0; +https://explorehtx.com)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15_000),
      })

      if (response.status === 404) return null
      if (response.status === 429) {
        // Rate limited — back off
        const backoff = Math.pow(2, attempt + 1) * 1000
        console.warn(`[Do713] Rate limited on ${url}. Waiting ${backoff}ms...`)
        await new Promise((r) => setTimeout(r, backoff))
        continue
      }

      if (!response.ok) {
        console.warn(`[Do713] HTTP ${response.status} for ${url}`)
        return null
      }

      return await response.text()
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const backoff = Math.pow(2, attempt) * 500
        await new Promise((r) => setTimeout(r, backoff))
        continue
      }
      console.error(`[Do713] Failed to fetch ${url}:`, err)
      return null
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeScrapedEvent(
  scraped: ScrapedEvent,
  fallbackDate: string
): NormalizedEvent {
  const startDate = parseDate(scraped.dateText, fallbackDate)

  // Generate a stable ID from the event URL path (most reliable identifier)
  const urlPath = scraped.eventUrl.replace(BASE_URL, '')
  const externalId = generateStableId(urlPath)

  return {
    externalId,
    source: 'do713',
    sourceUrl: scraped.eventUrl,
    title: scraped.title,
    description: scraped.description ?? '',
    startDate,
    venueName: scraped.venueName,
    venueAddress: scraped.venueAddress,
    imageUrl: scraped.imageUrl,
    imageAlt: scraped.title,
    rawData: {
      scrapedTitle: scraped.title,
      scrapedDate: scraped.dateText,
      scrapedVenue: scraped.venueName,
      scrapedUrl: scraped.eventUrl,
      fallbackDate,
    },
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class Do713Adapter extends EventAdapter {
  readonly source = 'do713'

  /** Maximum number of event detail pages to fetch per run. */
  private readonly detailFetchLimit: number

  /** Delay between page requests in milliseconds (politeness). */
  private readonly requestDelayMs: number

  constructor(options?: { detailFetchLimit?: number; requestDelayMs?: number }) {
    super()
    this.detailFetchLimit = options?.detailFetchLimit ?? 50
    this.requestDelayMs = options?.requestDelayMs ?? 300
  }

  async fetch(): Promise<NormalizedEvent[]> {
    console.log('[Do713] Starting event scrape for the next 30 days...')

    const dateUrls = buildDateUrls()
    const allEvents: NormalizedEvent[] = []
    const seenUrls = new Set<string>()

    // Phase 1: Scrape listing pages for each day
    for (const url of dateUrls) {
      // Extract the date portion from the URL (YYYY-MM-DD)
      const dateMatch = url.match(/\/events\/(\d{4}-\d{2}-\d{2})$/)
      const pageDate = dateMatch?.[1] ?? new Date().toISOString().split('T')[0]

      try {
        const html = await fetchPage(url)
        if (!html) {
          console.warn(`[Do713] No content for ${url}`)
          continue
        }

        const scraped = parseEventListings(html, pageDate)
        console.log(`[Do713] ${pageDate}: found ${scraped.length} events`)

        for (const event of scraped) {
          if (seenUrls.has(event.eventUrl)) continue
          seenUrls.add(event.eventUrl)

          allEvents.push(normalizeScrapedEvent(event, pageDate))
        }
      } catch (err) {
        console.error(`[Do713] Error scraping ${url}:`, err)
      }

      // Polite delay between listing page requests
      await new Promise((r) => setTimeout(r, this.requestDelayMs))
    }

    // Phase 2: Fetch detail pages for enrichment (up to the limit)
    const eventsToEnrich = allEvents.slice(0, this.detailFetchLimit)
    let enriched = 0

    console.log(
      `[Do713] Enriching up to ${eventsToEnrich.length} events with detail pages...`
    )

    for (const event of eventsToEnrich) {
      try {
        const html = await fetchPage(event.sourceUrl)
        if (!html) continue

        const details = parseEventDetail(html)

        if (details.description && !event.description) {
          event.description = details.description
        }
        if (details.venueName && !event.venueName) {
          event.venueName = details.venueName
        }
        if (details.venueAddress && !event.venueAddress) {
          event.venueAddress = details.venueAddress
        }
        if (details.imageUrl && !event.imageUrl) {
          event.imageUrl = details.imageUrl
        }

        enriched++
      } catch (err) {
        console.error(`[Do713] Error enriching ${event.sourceUrl}:`, err)
      }

      await new Promise((r) => setTimeout(r, this.requestDelayMs))
    }

    console.log(
      `[Do713] Enriched ${enriched} events with detail page data.`
    )
    console.log(
      `[Do713] Scrape complete. Returning ${allEvents.length} normalized events.`
    )

    return allEvents
  }
}
