// =============================================================================
// ExploreHTX — CultureMap Houston Adapter
// Fetches events/articles from the CultureMap Houston RSS feed and normalizes
// them into the shared NormalizedEvent shape.
// =============================================================================

import { EventAdapter, NormalizedEvent } from './base'

const FEED_URLS = [
  'https://houston.culturemap.com/feed/',
  'https://houston.culturemap.com/events/feed/',
]

// ---------------------------------------------------------------------------
// RSS XML parsing helpers (regex-based — no external XML parser required)
// ---------------------------------------------------------------------------

/**
 * Extract the text content of an XML element by tag name.
 * Returns `undefined` when the tag is not present.
 */
function extractTag(xml: string, tag: string): string | undefined {
  // Handle both <tag>content</tag> and <tag><![CDATA[content]]></tag>
  const re = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'i')
  const m = xml.match(re)
  if (!m) return undefined
  return (m[1] ?? m[2] ?? '').trim() || undefined
}

/**
 * Extract the `url` attribute from an `<enclosure>` element.
 */
function extractEnclosureUrl(xml: string): string | undefined {
  const m = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*\/?>/i)
  return m?.[1] ?? undefined
}

/**
 * Extract the `url` attribute from a `<media:content>` element.
 */
function extractMediaContentUrl(xml: string): string | undefined {
  const m = xml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*\/?>/i)
  return m?.[1] ?? undefined
}

/**
 * Extract all `<category>` values from an item.
 */
function extractCategories(xml: string): string[] {
  const categories: string[] = []
  const re = /<category[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/category>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const value = (m[1] ?? m[2] ?? '').trim()
    if (value) categories.push(value)
  }
  return categories
}

/**
 * Split an RSS document into individual `<item>` blocks.
 */
function extractItems(xml: string): string[] {
  const items: string[] = []
  const re = /<item[\s>]([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    items.push(m[0])
  }
  return items
}

/**
 * Strip HTML tags from a string and collapse whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&#8216;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/&#8211;/gi, '–')
    .replace(/&#8212;/gi, '—')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

/**
 * Map RSS category strings to the project's EventCategory slugs.
 */
function mapCategory(categories: string[]): string | undefined {
  const joined = categories.join(' ').toLowerCase()

  if (/\bmusic\b/.test(joined) || /\bconcert\b/.test(joined)) return 'music-concerts'
  if (/\bsport\b/.test(joined) || /\bfitness\b/.test(joined)) return 'sports'
  if (/\bfood\b/.test(joined) || /\bdining\b/.test(joined) || /\bdrink\b/.test(joined) || /\brestaurant\b/.test(joined)) return 'food-dining'
  if (/\btheater\b/.test(joined) || /\btheatre\b/.test(joined) || /\bperform/.test(joined)) return 'theater'
  if (/\bcomedy\b/.test(joined)) return 'comedy'
  if (/\bart\b/.test(joined) || /\bculture\b/.test(joined) || /\bmuseum\b/.test(joined) || /\bgallery\b/.test(joined)) return 'arts-culture'
  if (/\bfilm\b/.test(joined) || /\bmovie\b/.test(joined)) return 'arts-culture'
  if (/\bnightlife\b/.test(joined) || /\bbar\b/.test(joined) || /\bclub\b/.test(joined)) return 'nightlife'
  if (/\bfamily\b/.test(joined) || /\bkid\b/.test(joined) || /\bchildren\b/.test(joined)) return 'family-kids'
  if (/\boutdoor\b/.test(joined) || /\bnature\b/.test(joined) || /\bpark\b/.test(joined)) return 'outdoor-parks'
  if (/\bfestival\b/.test(joined) || /\bfair\b/.test(joined)) return 'festivals'
  if (/\bmarket\b/.test(joined) || /\bshopping\b/.test(joined)) return 'markets-shopping'
  if (/\bholiday\b/.test(joined) || /\bseasonal\b/.test(joined)) return 'festivals'

  return undefined
}

// ---------------------------------------------------------------------------
// External ID generation
// ---------------------------------------------------------------------------

/**
 * Derive a stable external ID from the item's link or guid.
 * Uses the URL pathname to create a compact, deterministic identifier.
 */
function deriveExternalId(link?: string, guid?: string): string | undefined {
  const url = link ?? guid
  if (!url) return undefined

  try {
    const parsed = new URL(url)
    // Use the pathname, strip leading/trailing slashes, and replace slashes
    // with dashes to form a compact slug. Example:
    //   /news/arts/best-exhibits-march-2026/ → "news-arts-best-exhibits-march-2026"
    return parsed.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || url
  } catch {
    // If URL parsing fails, hash the raw string
    return url.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }
}

// ---------------------------------------------------------------------------
// Item normalizer
// ---------------------------------------------------------------------------

interface RssItem {
  title?: string
  link?: string
  guid?: string
  description?: string
  pubDate?: string
  enclosureUrl?: string
  mediaContentUrl?: string
  dcCreator?: string
  categories: string[]
}

function parseItem(xml: string): RssItem {
  return {
    title: extractTag(xml, 'title'),
    link: extractTag(xml, 'link'),
    guid: extractTag(xml, 'guid'),
    description: extractTag(xml, 'description'),
    pubDate: extractTag(xml, 'pubDate'),
    enclosureUrl: extractEnclosureUrl(xml),
    mediaContentUrl: extractMediaContentUrl(xml),
    dcCreator: extractTag(xml, 'dc:creator'),
    categories: extractCategories(xml),
  }
}

function normalizeItem(item: RssItem): NormalizedEvent | null {
  const externalId = deriveExternalId(item.link, item.guid)
  if (!externalId) return null

  const title = item.title ? stripHtml(item.title) : undefined
  if (!title) return null

  // Use pubDate as the event start date (best available from RSS)
  let startDate: string
  if (item.pubDate) {
    try {
      startDate = new Date(item.pubDate).toISOString()
    } catch {
      startDate = new Date().toISOString()
    }
  } else {
    startDate = new Date().toISOString()
  }

  const description = item.description ? stripHtml(item.description) : ''
  const imageUrl = item.enclosureUrl ?? item.mediaContentUrl
  const sourceUrl = item.link ?? item.guid ?? ''
  const category = mapCategory(item.categories)
  const tags = item.categories.length > 0 ? item.categories : undefined

  return {
    externalId,
    source: 'culturemap',
    sourceUrl,
    title,
    description,
    startDate,
    imageUrl,
    imageAlt: title,
    category,
    tags,
    organizerName: item.dcCreator,
    rawData: item as unknown as Record<string, unknown>,
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class CultureMapAdapter extends EventAdapter {
  readonly source = 'culturemap'

  async fetch(): Promise<NormalizedEvent[]> {
    console.log('[CultureMap] Starting RSS feed fetch for Houston...')

    for (const feedUrl of FEED_URLS) {
      try {
        console.log(`[CultureMap] Trying feed: ${feedUrl}`)

        const response = await fetch(feedUrl, {
          headers: {
            Accept: 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'ExploreHTX/1.0 (RSS Reader)',
          },
        })

        if (!response.ok) {
          console.warn(
            `[CultureMap] Feed returned ${response.status} ${response.statusText}: ${feedUrl}`
          )
          continue
        }

        const xml = await response.text()
        const items = extractItems(xml)

        if (items.length === 0) {
          console.warn(`[CultureMap] No <item> elements found in feed: ${feedUrl}`)
          continue
        }

        console.log(`[CultureMap] Found ${items.length} items in feed: ${feedUrl}`)

        const events: NormalizedEvent[] = []

        for (const itemXml of items) {
          const parsed = parseItem(itemXml)
          const normalized = normalizeItem(parsed)
          if (normalized) {
            events.push(normalized)
          }
        }

        console.log(
          `[CultureMap] Fetch complete. Returning ${events.length} normalized events.`
        )
        return events
      } catch (err) {
        console.error(`[CultureMap] Error fetching feed ${feedUrl}:`, err)
        continue
      }
    }

    console.warn('[CultureMap] All feed URLs failed. Returning empty result set.')
    return []
  }
}
