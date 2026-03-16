// =============================================================================
// ExploreHTX — Event Slug Generator
// Produces deterministic, URL-safe slugs for events.
// =============================================================================

import { slugify } from '../utils/format'

/** Maximum total length for the generated slug (characters). */
const MAX_SLUG_LENGTH = 80

/**
 * Format an ISO 8601 date string as a compact YYYYMMDD suffix.
 * Returns 'unknowndate' if the value cannot be parsed.
 */
function formatDateSuffix(startDate: string): string {
  const date = new Date(startDate)
  if (isNaN(date.getTime())) return 'unknowndate'

  const year  = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day   = String(date.getUTCDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

/**
 * Generate a unique, URL-safe slug for an event.
 *
 * Format: `<slugified-title>-YYYYMMDD`
 * Maximum total length: 80 characters (the title portion is truncated if needed).
 *
 * Examples:
 *   "Houston Rodeo 2026" + "2026-02-18T..." → "houston-rodeo-2026-20260218"
 *   "" + "2026-01-01T..."                   → "event-20260101"
 */
export function generateEventSlug(title: string, startDate: string): string {
  const dateSuffix = `-${formatDateSuffix(startDate)}`

  // Maximum characters available for the title portion.
  const maxTitleLength = MAX_SLUG_LENGTH - dateSuffix.length

  const rawTitle = title.trim() || 'event'
  let sluggedTitle = slugify(rawTitle)

  // Truncate slug at a word boundary (hyphen) when over the limit.
  if (sluggedTitle.length > maxTitleLength) {
    sluggedTitle = sluggedTitle.slice(0, maxTitleLength).replace(/-[^-]*$/, '')

    // Edge case: if slugify produced one very long token with no hyphens,
    // fall back to a hard character truncation.
    if (!sluggedTitle || sluggedTitle.length === 0) {
      sluggedTitle = slugify(rawTitle).slice(0, maxTitleLength)
    }
  }

  // Final safety guard against an empty slug title.
  if (!sluggedTitle) {
    sluggedTitle = 'event'
  }

  return `${sluggedTitle}${dateSuffix}`
}
