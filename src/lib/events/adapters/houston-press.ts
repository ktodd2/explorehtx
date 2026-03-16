// =============================================================================
// ExploreHTX — Houston Press RSS Adapter
// Fetches events from the Houston Press calendar RSS feed and normalizes them
// into the shared NormalizedEvent shape.
// =============================================================================

import { EventAdapter, NormalizedEvent } from './base'
import { createHash } from 'node:crypto'

// ---------------------------------------------------------------------------
// RSS feed URLs to try in order of preference
// ---------------------------------------------------------------------------

const FEED_URLS = [
  'https://www.houstonpress.com/calendar/rss',
  'https://www.houstonpress.com/events/rss',
  'https://www.houstonpress.com/rss',
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip all HTML tags from a string, decode common HTML entities,
 * and collapse whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate a stable, deterministic external ID from a string value
 * (typically the item's guid or link URL).
 */
function generateHashId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

/**
 * Extract the text content between an XML/RSS tag pair.
 * Returns `undefined` when the tag is not found.
 */
function extractTag(xml: string, tag: string): string | undefined {
  // Handle both <tag>content</tag> and <tag><![CDATA[content]]></tag>
  const pattern = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`,
    'i'
  )
  const match = xml.match(pattern)
  if (!match) return undefined
  // CDATA content is in group 1, plain content in group 2
  return (match[1] ?? match[2] ?? '').trim() || undefined
}

/**
 * Extract all values for a repeated tag (e.g. <category>).
 */
function extractAllTags(xml: string, tag: string): string[] {
  const pattern = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`,
    'gi'
  )
  const results: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(xml)) !== null) {
    const value = (match[1] ?? match[2] ?? '').trim()
    if (value) results.push(value)
  }
  return results
}

/**
 * Extract the first image URL from HTML content (description or encoded content).
 */
function extractImageUrl(html: string): string | undefined {
  // Try <img src="...">
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch?.[1]) return imgMatch[1]

  // Try <enclosure url="..."> (RSS media)
  const enclosureMatch = html.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
  if (enclosureMatch?.[1]) return enclosureMatch[1]

  return undefined
}

/**
 * Extract image from an RSS item block, checking media tags and enclosures
 * before falling back to the description HTML.
 */
function extractItemImage(itemXml: string): string | undefined {
  // <media:content url="...">
  const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i)
  if (mediaMatch?.[1]) return mediaMatch[1]

  // <media:thumbnail url="...">
  const thumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)
  if (thumbMatch?.[1]) return thumbMatch[1]

  // <enclosure url="..." type="image/...">
  const enclosureMatch = itemXml.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\/[^"']*["']/i
  )
  if (enclosureMatch?.[1]) return enclosureMatch[1]

  // Fall back to first image in description/content
  const description = extractTag(itemXml, 'description') ?? ''
  const contentEncoded = extractTag(itemXml, 'content:encoded') ?? ''
  return extractImageUrl(description) || extractImageUrl(contentEncoded)
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

/** Map from lowercased RSS category keywords to ExploreHTX category slugs. */
const CATEGORY_MAP: Record<string, string> = {
  music: 'music-concerts',
  concert: 'music-concerts',
  concerts: 'music-concerts',
  'live music': 'music-concerts',
  comedy: 'comedy',
  'stand-up': 'comedy',
  'stand up': 'comedy',
  food: 'food-dining',
  dining: 'food-dining',
  drink: 'food-dining',
  drinks: 'food-dining',
  restaurant: 'food-dining',
  'food & drink': 'food-dining',
  art: 'arts-culture',
  arts: 'arts-culture',
  culture: 'arts-culture',
  museum: 'arts-culture',
  gallery: 'arts-culture',
  theater: 'theater',
  theatre: 'theater',
  'performing arts': 'theater',
  sport: 'sports',
  sports: 'sports',
  fitness: 'sports',
  nightlife: 'nightlife',
  club: 'nightlife',
  bar: 'nightlife',
  bars: 'nightlife',
  family: 'family-kids',
  kids: 'family-kids',
  children: 'family-kids',
  outdoor: 'outdoor-parks',
  outdoors: 'outdoor-parks',
  nature: 'outdoor-parks',
  parks: 'outdoor-parks',
  festival: 'festivals',
  festivals: 'festivals',
  fair: 'festivals',
  holiday: 'festivals',
  market: 'markets-shopping',
  markets: 'markets-shopping',
  shopping: 'markets-shopping',
}

/**
 * Attempt to map RSS category strings to an ExploreHTX category slug.
 * Returns the first match found, or `undefined`.
 */
function mapCategories(categories: string[]): string | undefined {
  for (const cat of categories) {
    const lower = cat.toLowerCase().trim()
    // Direct lookup
    if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower]
    // Partial match — check if any keyword is contained in the category string
    for (const [keyword, slug] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(keyword)) return slug
    }
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Item parser
// ---------------------------------------------------------------------------

interface RssItem {
  title: string
  link: string
  description: string
  pubDate?: string
  guid?: string
  categories: string[]
  imageUrl?: string
}

/**
 * Parse a single <item> block from the RSS XML into a structured object.
 */
function parseItem(itemXml: string): RssItem | null {
  const title = extractTag(itemXml, 'title')
  const link = extractTag(itemXml, 'link')

  if (!title || !link) return null

  const rawDescription =
    extractTag(itemXml, 'content:encoded') ??
    extractTag(itemXml, 'description') ??
    ''

  return {
    title: stripHtml(title),
    link,
    description: stripHtml(rawDescription),
    pubDate: extractTag(itemXml, 'pubDate'),
    guid: extractTag(itemXml, 'guid'),
    categories: extractAllTags(itemXml, 'category').map(stripHtml),
    imageUrl: extractItemImage(itemXml),
  }
}

/**
 * Normalize a parsed RSS item into a NormalizedEvent.
 */
function normalizeItem(item: RssItem): NormalizedEvent {
  const identifier = item.guid || item.link
  const externalId = generateHashId(identifier)

  // Use pubDate as startDate; fall back to current time
  const startDate = item.pubDate
    ? new Date(item.pubDate).toISOString()
    : new Date().toISOString()

  return {
    externalId,
    source: 'houston-press',
    sourceUrl: item.link,
    title: item.title,
    description: item.description,
    startDate,
    category: mapCategories(item.categories),
    tags: item.categories.length > 0 ? item.categories : undefined,
    imageUrl: item.imageUrl,
    imageAlt: item.title,
    rawData: {
      guid: item.guid,
      link: item.link,
      pubDate: item.pubDate,
      categories: item.categories,
    },
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class HoustonPressAdapter extends EventAdapter {
  readonly source = 'houston-press'

  async fetch(): Promise<NormalizedEvent[]> {
    console.log('[HoustonPress] Starting RSS feed fetch...')

    const xml = await this.fetchFeed()
    if (!xml) {
      console.warn('[HoustonPress] Could not retrieve any RSS feed. Returning [].')
      return []
    }

    const items = this.parseItems(xml)
    console.log(`[HoustonPress] Parsed ${items.length} items from feed.`)

    const events: NormalizedEvent[] = []
    for (const itemXml of items) {
      try {
        const parsed = parseItem(itemXml)
        if (parsed) {
          events.push(normalizeItem(parsed))
        }
      } catch (err) {
        console.warn('[HoustonPress] Failed to parse an item, skipping:', err)
      }
    }

    console.log(
      `[HoustonPress] Fetch complete. Returning ${events.length} normalized events.`
    )
    return events
  }

  /**
   * Try each candidate feed URL in order. Return the first successful
   * response body, or `null` if all fail.
   */
  private async fetchFeed(): Promise<string | null> {
    for (const url of FEED_URLS) {
      try {
        console.log(`[HoustonPress] Trying feed URL: ${url}`)
        const response = await fetch(url, {
          headers: {
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
            'User-Agent': 'ExploreHTX/1.0 (event-aggregator)',
          },
          signal: AbortSignal.timeout(15_000),
        })

        if (!response.ok) {
          console.warn(
            `[HoustonPress] ${url} returned ${response.status} ${response.statusText}`
          )
          continue
        }

        const body = await response.text()

        // Sanity-check that this looks like RSS/XML
        if (!body.includes('<item') && !body.includes('<entry')) {
          console.warn(`[HoustonPress] ${url} did not return valid RSS. Trying next.`)
          continue
        }

        console.log(`[HoustonPress] Successfully fetched feed from ${url}`)
        return body
      } catch (err) {
        console.warn(`[HoustonPress] Error fetching ${url}:`, err)
      }
    }
    return null
  }

  /**
   * Split the feed XML into individual <item> blocks.
   */
  private parseItems(xml: string): string[] {
    const items: string[] = []
    const itemPattern = /<item[\s>][\s\S]*?<\/item>/gi
    let match: RegExpExecArray | null
    while ((match = itemPattern.exec(xml)) !== null) {
      items.push(match[0])
    }
    return items
  }
}
