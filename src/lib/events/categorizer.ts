// =============================================================================
// ExploreHTX — Event Categorizer
// Auto-assigns an EventCategory slug based on keywords and known venue names.
// =============================================================================

import type { NormalizedEvent } from './adapters/base'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All valid category slugs from the database schema. */
const VALID_SLUGS = new Set([
  'music-concerts',
  'sports',
  'food-dining',
  'arts-culture',
  'nightlife',
  'family-kids',
  'outdoor-parks',
  'festivals',
  'free-events',
  'comedy',
  'theater',
  'markets-shopping',
])

/**
 * Keyword → category mapping.
 * Order matters: the first matching rule wins.
 * Each entry is [category-slug, keywords[]].
 */
const KEYWORD_RULES: [string, string[]][] = [
  ['comedy',          ['comedy', 'comedian', 'standup', 'stand-up', 'improv', 'open mic']],
  ['theater',         ['theater', 'theatre', 'broadway', 'opera', 'musical', 'play']],
  ['music-concerts',  ['concert', 'live music', 'band', 'singer', 'festival', 'rap', 'hip hop', 'hip-hop', 'jazz', 'country', 'rock', 'r&b', 'karaoke', 'dj']],
  ['sports',          ['game', 'match', 'tournament', 'race', 'run', 'marathon', 'basketball', 'football', 'soccer', 'baseball', 'boxing', 'wrestling', 'ufc']],
  ['food-dining',     ['food', 'dinner', 'brunch', 'tasting', 'chef', 'culinary', 'restaurant', 'bbq', 'barbecue', 'wine', 'beer', 'cocktail', 'cooking']],
  ['arts-culture',    ['art', 'gallery', 'museum', 'exhibition', 'painting', 'sculpture', 'cultural', 'dance', 'ballet']],
  ['nightlife',       ['nightclub', 'club', 'party', 'lounge', 'happy hour', 'bar crawl', 'ladies night', 'after dark']],
  ['family-kids',     ['kids', 'children', 'family', 'toddler', 'youth', 'puppet', 'cartoon', 'petting zoo', 'bounce house']],
  ['outdoor-parks',   ['hiking', 'park', 'garden', 'outdoor', 'nature', 'camping', 'fishing', 'kayak', 'trail', 'bike ride']],
  ['festivals',       ['festival', 'fair', 'carnival', 'fiesta', 'celebration', 'parade']],
  ['markets-shopping',['market', 'bazaar', 'flea', 'vendor', 'craft fair', 'shopping', 'pop-up shop', 'garage sale']],
]

/**
 * Venue name fragment → category override.
 * Uses case-insensitive substring matching.
 */
const VENUE_CATEGORY_MAP: [string, string][] = [
  ['nrg stadium',                    'sports'],
  ['minute maid park',               'sports'],
  ['toyota center',                  'sports'],
  ['bbva stadium',                   'sports'],
  ['shell energy stadium',           'sports'],
  ['house of blues',                 'music-concerts'],
  ['white oak music hall',           'music-concerts'],
  ['warehouse live',                 'music-concerts'],
  ['713 music hall',                 'music-concerts'],
  ['museum of fine arts',            'arts-culture'],
  ['menil collection',               'arts-culture'],
  ['contemporary arts museum',       'arts-culture'],
  ['miller outdoor theatre',         'free-events'],
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return true if `haystack` contains `needle` as a whole-word or phrase match.
 * Simple lowercased substring check — sufficient for keyword scanning.
 */
function containsPhrase(haystack: string, needle: string): boolean {
  return haystack.includes(needle)
}

/**
 * Scan the lowercased text against the keyword rules and return the first
 * matching category slug, or null if no rule fires.
 * `titleOnly` restricts the scan to title text.
 */
function matchKeywords(text: string, titleOnly = false): string | null {
  for (const [slug, keywords] of KEYWORD_RULES) {
    for (const kw of keywords) {
      if (containsPhrase(text, kw)) return slug
    }
  }
  return null
}

/**
 * Check venue name against the known Houston venue map.
 * Returns a category slug or null.
 */
function matchVenue(venueName?: string): string | null {
  if (!venueName) return null
  const lc = venueName.toLowerCase()
  for (const [fragment, slug] of VENUE_CATEGORY_MAP) {
    if (lc.includes(fragment)) return slug
  }
  return null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assign an EventCategory slug to an event.
 *
 * Priority order:
 * 1. Adapter-provided category (if it's a known valid slug)
 * 2. Known Houston venue name mapping
 * 3. 'free-events' if the word "free" appears in the title
 * 4. Keyword scan of (title + description)
 * 5. Default: 'festivals'
 */
export function categorizeEvent(event: NormalizedEvent): string {
  // 1. Honor the adapter's category when it's a recognized slug.
  if (event.category && VALID_SLUGS.has(event.category)) {
    return event.category
  }

  // 2. Venue-based override.
  const venueCategory = matchVenue(event.venueName)
  if (venueCategory) return venueCategory

  // 3. 'free-events' — title must contain the standalone word "free".
  const titleLc = event.title.toLowerCase()
  if (/\bfree\b/.test(titleLc)) return 'free-events'

  // 4. Keyword scan across title and description.
  const combined = `${titleLc} ${event.description.toLowerCase()}`
  const keywordCategory = matchKeywords(combined)
  if (keywordCategory) return keywordCategory

  // 5. Catch-all.
  return 'festivals'
}
