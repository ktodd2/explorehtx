// =============================================================================
// ExploreHTX — Restaurant Deduplicator
// Detects duplicate restaurants using fuzzy name + address matching.
// =============================================================================

import type { Restaurant } from '../../../types/database'
import type { DiscoveryCandidate } from '../prompts/restaurant-research'

/**
 * Candidate restaurant from AI discovery (before insertion)
 * Minimal interface for duplicate checking - compatible with DiscoveryCandidate
 */
export interface RestaurantCandidate {
  name: string
  address?: string
  neighborhood?: string
}

// Re-export for convenience
export type { DiscoveryCandidate }

/**
 * Result of duplicate check
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  matchedRestaurant?: Restaurant
  similarity: number  // 0-100
  matchType: 'exact' | 'fuzzy-name' | 'fuzzy-address' | 'none'
}

/**
 * Normalize a string for comparison:
 * - Lowercase
 * - Remove punctuation
 * - Collapse whitespace
 * - Remove common words like "The", "Restaurant", "Grill", etc.
 */
function normalize(str: string): string {
  const stopWords = [
    'the', 'restaurant', 'grill', 'cafe', 'bar', 'kitchen', 'eatery',
    'bistro', 'tavern', 'lounge', 'houston', 'tx', 'texas',
  ]

  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')     // Collapse whitespace
    .trim()
    .split(' ')
    .filter(word => !stopWords.includes(word))
    .join(' ')
}

/**
 * Normalize address for comparison:
 * - Lowercase
 * - Remove unit/suite numbers
 * - Standardize street abbreviations
 * - Remove city/state/zip
 */
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/\s*#\s*\d+/g, '')           // Remove #123
    .replace(/\s*suite\s*\w+/gi, '')      // Remove Suite A
    .replace(/\s*unit\s*\w+/gi, '')       // Remove Unit B
    .replace(/,?\s*(houston|tx|texas)\s*\d{5}(-\d{4})?/gi, '') // Remove city/state/zip
    .replace(/\bst\b/g, 'street')
    .replace(/\brd\b/g, 'road')
    .replace(/\bdr\b/g, 'drive')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\bln\b/g, 'lane')
    .replace(/\bct\b/g, 'court')
    .replace(/\bpkwy\b/g, 'parkway')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate Levenshtein distance between two strings.
 * Returns similarity as a percentage (0-100).
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 100
  if (!a.length || !b.length) return 0

  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      )
    }
  }

  const distance = matrix[a.length][b.length]
  const maxLen = Math.max(a.length, b.length)
  return Math.round((1 - distance / maxLen) * 100)
}

/**
 * Check if a candidate restaurant already exists in the database.
 *
 * Matching logic:
 * 1. Exact name match → definitely duplicate
 * 2. Fuzzy name match (>85% similar) → likely duplicate
 * 3. Fuzzy address match (>90% similar) when names are similar (>70%) → duplicate
 *
 * @param candidate The new restaurant to check
 * @param existingRestaurants All restaurants currently in the database
 * @returns DuplicateCheckResult with match details
 */
export function checkDuplicate(
  candidate: RestaurantCandidate,
  existingRestaurants: Restaurant[]
): DuplicateCheckResult {
  const normalizedName = normalize(candidate.name)
  const normalizedAddress = candidate.address ? normalizeAddress(candidate.address) : ''

  let bestMatch: DuplicateCheckResult = {
    isDuplicate: false,
    similarity: 0,
    matchType: 'none',
  }

  for (const existing of existingRestaurants) {
    const existingNormalizedName = normalize(existing.name)
    const nameSimilarity = stringSimilarity(normalizedName, existingNormalizedName)

    // Check for exact name match
    if (nameSimilarity === 100) {
      return {
        isDuplicate: true,
        matchedRestaurant: existing,
        similarity: 100,
        matchType: 'exact',
      }
    }

    // Check for fuzzy name match (>85%)
    if (nameSimilarity > 85) {
      if (nameSimilarity > bestMatch.similarity) {
        bestMatch = {
          isDuplicate: true,
          matchedRestaurant: existing,
          similarity: nameSimilarity,
          matchType: 'fuzzy-name',
        }
      }
    }

    // Check address similarity when names are somewhat similar (>70%)
    if (nameSimilarity > 70 && normalizedAddress && existing.address) {
      const existingNormalizedAddr = normalizeAddress(existing.address)
      const addrSimilarity = stringSimilarity(normalizedAddress, existingNormalizedAddr)

      // Same address → almost certainly the same place
      if (addrSimilarity > 90) {
        const combinedSimilarity = Math.round((nameSimilarity + addrSimilarity) / 2)
        if (combinedSimilarity > bestMatch.similarity) {
          bestMatch = {
            isDuplicate: true,
            matchedRestaurant: existing,
            similarity: combinedSimilarity,
            matchType: 'fuzzy-address',
          }
        }
      }
    }

    // Check if same neighborhood + very similar name (could be typo)
    if (
      nameSimilarity > 75 &&
      candidate.neighborhood &&
      existing.neighborhood &&
      normalize(candidate.neighborhood) === normalize(existing.neighborhood)
    ) {
      if (nameSimilarity > bestMatch.similarity) {
        bestMatch = {
          isDuplicate: true,
          matchedRestaurant: existing,
          similarity: nameSimilarity,
          matchType: 'fuzzy-name',
        }
      }
    }
  }

  return bestMatch
}

/**
 * Filter out duplicates from a list of candidates.
 * Uses generics to preserve the full type of candidates passed in.
 *
 * @param candidates List of restaurant candidates from AI
 * @param existingRestaurants All restaurants currently in the database
 * @returns Object with unique candidates and duplicates found
 */
export function filterDuplicates<T extends RestaurantCandidate>(
  candidates: T[],
  existingRestaurants: Restaurant[]
): {
  unique: T[]
  duplicates: Array<{
    candidate: T
    result: DuplicateCheckResult
  }>
} {
  const unique: T[] = []
  const duplicates: Array<{
    candidate: T
    result: DuplicateCheckResult
  }> = []

  // Also track names we've already accepted to avoid duplicates within the batch
  const acceptedNames: string[] = []

  for (const candidate of candidates) {
    const normalizedName = normalize(candidate.name)

    // Check against already accepted candidates in this batch
    const inBatchDuplicate = acceptedNames.some(
      name => stringSimilarity(name, normalizedName) > 85
    )

    if (inBatchDuplicate) {
      duplicates.push({
        candidate,
        result: {
          isDuplicate: true,
          similarity: 100,
          matchType: 'fuzzy-name',
        },
      })
      continue
    }

    // Check against existing database
    const result = checkDuplicate(candidate, existingRestaurants)

    if (result.isDuplicate) {
      duplicates.push({ candidate, result })
    } else {
      unique.push(candidate)
      acceptedNames.push(normalizedName)
    }
  }

  return { unique, duplicates }
}
