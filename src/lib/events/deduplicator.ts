// =============================================================================
// ExploreHTX — Event Deduplicator
// Removes duplicate events across sources using exact-id and fuzzy matching.
// =============================================================================

import type { NormalizedEvent } from './adapters/base'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Count non-null/undefined/empty-string fields on a NormalizedEvent.
 * Used to determine which copy of a duplicate carries more data.
 */
function countFilledFields(event: NormalizedEvent): number {
  return Object.values(event).filter(
    (v) => v !== undefined && v !== null && v !== ''
  ).length
}

/**
 * Merge two duplicate events: keep the richer record as the base and fill
 * any undefined/null/empty fields from the secondary record.
 */
function mergeEvents(primary: NormalizedEvent, secondary: NormalizedEvent): NormalizedEvent {
  const merged = { ...primary }

  for (const _key of Object.keys(secondary) as (keyof NormalizedEvent)[]) {
    const key = _key
    const primaryValue = merged[key]
    const secondaryValue = secondary[key]

    const isEmpty = primaryValue === undefined || primaryValue === null || primaryValue === ''
    if (isEmpty && secondaryValue !== undefined && secondaryValue !== null && secondaryValue !== '') {
      // TypeScript doesn't narrow the assignment through the generic key, so cast.
      ;(merged as Record<string, unknown>)[key] = secondaryValue
    }
  }

  // Merge tags arrays — union of both, deduplicated.
  const primaryTags = primary.tags ?? []
  const secondaryTags = secondary.tags ?? []
  if (secondaryTags.length > 0) {
    merged.tags = Array.from(new Set([...primaryTags, ...secondaryTags]))
  }

  return merged
}

/**
 * Compute the Levenshtein distance between two strings (simple iterative DP).
 * Short-circuits early when the distance already exceeds `maxDistance`.
 */
function levenshtein(a: string, b: string, maxDistance = 10): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Bail out early if lengths differ too much.
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1

  const prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    const curr: number[] = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost    // substitution
      )
    }

    // Early exit if the minimum in this row already exceeds maxDistance.
    if (Math.min(...curr) > maxDistance) return maxDistance + 1

    prev.splice(0, prev.length, ...curr)
  }

  return prev[b.length]
}

/**
 * Normalize a venue name for fuzzy comparison:
 * lowercase, strip punctuation, collapse whitespace.
 */
function normalizeVenue(name: string): string {
  return name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Return true if the two venue strings are considered the same venue:
 * - one contains the other (case-insensitive), OR
 * - Levenshtein distance is less than 3.
 */
function venuesMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  const na = normalizeVenue(a)
  const nb = normalizeVenue(b)
  if (na.includes(nb) || nb.includes(na)) return true
  return levenshtein(na, nb, 3) < 3
}

/**
 * Tokenize a title: lowercase, strip punctuation, split on whitespace.
 */
function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Return true if the two titles are similar enough to be the same event.
 * Rule: one title's token set contains ≥ 80% of the other's tokens.
 */
function titlesMatch(a: string, b: string): boolean {
  const ta = new Set(tokenize(a))
  const tb = new Set(tokenize(b))

  if (ta.size === 0 || tb.size === 0) return false

  const smaller = ta.size <= tb.size ? ta : tb
  const larger  = ta.size <= tb.size ? tb : ta

  const overlap = [...smaller].filter((t) => larger.has(t)).length
  return overlap / smaller.size >= 0.8
}

/**
 * Return true if the two ISO 8601 start-date strings are within 2 hours of
 * each other. Returns false if either date is unparseable.
 */
function datesWithinTwoHours(a: string, b: string): boolean {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  if (isNaN(da) || isNaN(db)) return false
  return Math.abs(da - db) <= 2 * 60 * 60 * 1000
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Deduplicate a flat array of NormalizedEvent objects.
 *
 * Pass 1 — Exact dedup: group by `source + externalId`. When the same
 *   (source, id) pair appears more than once, keep the richer record.
 *
 * Pass 2 — Fuzzy dedup: among events from *different* sources, flag pairs
 *   that share the same approximate start time, similar venue, and similar
 *   title. Merge the pair, keeping the richer record as the primary.
 */
export function deduplicateEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  // ------------------------------------------------------------------
  // Pass 1: exact (source + externalId) deduplication
  // ------------------------------------------------------------------
  const exactMap = new Map<string, NormalizedEvent>()

  for (const event of events) {
    const key = `${event.source}::${event.externalId}`
    const existing = exactMap.get(key)
    if (!existing) {
      exactMap.set(key, event)
    } else {
      const richer =
        countFilledFields(event) >= countFilledFields(existing)
          ? mergeEvents(event, existing)
          : mergeEvents(existing, event)
      exactMap.set(key, richer)
    }
  }

  let deduplicated = Array.from(exactMap.values())

  // ------------------------------------------------------------------
  // Pass 2: fuzzy cross-source deduplication
  // ------------------------------------------------------------------
  // We build a new list, skipping events that have been absorbed into
  // an earlier event via merge.
  const absorbed = new Set<number>()
  const result: NormalizedEvent[] = []

  for (let i = 0; i < deduplicated.length; i++) {
    if (absorbed.has(i)) continue

    let base = deduplicated[i]

    for (let j = i + 1; j < deduplicated.length; j++) {
      if (absorbed.has(j)) continue

      const candidate = deduplicated[j]

      // Only fuzzy-match across different sources.
      if (base.source === candidate.source) continue

      const isFuzzyDuplicate =
        datesWithinTwoHours(base.startDate, candidate.startDate) &&
        venuesMatch(base.venueName, candidate.venueName) &&
        titlesMatch(base.title, candidate.title)

      if (isFuzzyDuplicate) {
        const baseFilled = countFilledFields(base)
        const candidateFilled = countFilledFields(candidate)
        base = baseFilled >= candidateFilled
          ? mergeEvents(base, candidate)
          : mergeEvents(candidate, base)
        absorbed.add(j)
      }
    }

    result.push(base)
  }

  return result
}
