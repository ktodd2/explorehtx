// =============================================================================
// ExploreHTX — Restaurant Profile Validator & Confidence Scorer
// Validates AI-generated restaurant profiles and calculates confidence scores.
// =============================================================================

import type { ProfileResponse } from '../prompts/restaurant-research'
import type { RestaurantStatus } from '../../../types/database'

/**
 * Validation result with confidence scoring
 */
export interface ValidationResult {
  isValid: boolean
  confidenceScore: number  // 0-100
  recommendedStatus: RestaurantStatus
  featuredEligible: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Confidence scoring breakdown
 */
interface ScoreBreakdown {
  address: number          // +20: Has complete address
  phone: number            // +15: Has phone number
  website: number          // +15: Has website URL
  hours: number            // +15: Has hours information
  menu: number             // +10: Has menu items (signature dishes)
  ambiance: number         // +10: Has ambiance/features
  priceRange: number       // +10: Has price range
  neighborhood: number     // +5: Neighborhood recognized
}

/**
 * Known Houston neighborhoods for validation
 */
const KNOWN_NEIGHBORHOODS = new Set([
  'montrose',
  'the heights',
  'heights',
  'downtown',
  'midtown',
  'river oaks',
  'east end',
  'museum district',
  'galleria',
  'rice village',
  'washington avenue',
  'upper kirby',
  'memorial',
  'spring branch',
  'chinatown',
  'bellaire',
  'eado',
  'garden oaks',
  'oak forest',
  'west university',
  'west u',
  'med center',
  'medical center',
  'energy corridor',
  'katy',
  'sugar land',
  'pearland',
  'cypress',
  'humble',
  'kingwood',
  'woodlands',
  'the woodlands',
])

/**
 * Valid price ranges
 */
const VALID_PRICE_RANGES = new Set(['$', '$$', '$$$', '$$$$'])

/**
 * Valid noise levels
 */
const VALID_NOISE_LEVELS = new Set(['quiet', 'moderate', 'lively', 'loud'])

/**
 * Validate Houston address format
 */
function isValidHoustonAddress(address: string | null): boolean {
  if (!address) return false

  // Should contain a street number, street name, and Houston/TX
  const hasStreetNumber = /^\d+\s/.test(address)
  const hasHouston = /houston|tx|texas/i.test(address)
  const minLength = address.length > 15

  return hasStreetNumber && hasHouston && minLength
}

/**
 * Validate phone number format
 */
function isValidPhone(phone: string | null): boolean {
  if (!phone) return false

  // Accept various formats: 713-555-1234, (713) 555-1234, 713.555.1234
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length === 10 || digitsOnly.length === 11
}

/**
 * Validate URL format
 */
function isValidUrl(url: string | null): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate hours object
 */
function hasValidHours(hours: Record<string, { open: string; close: string }> | null): boolean {
  if (!hours || typeof hours !== 'object') return false

  const days = Object.keys(hours)
  if (days.length === 0) return false

  // Check at least 3 days have valid hour entries
  const validDays = days.filter(day => {
    const dayHours = hours[day]
    if (!dayHours || typeof dayHours !== 'object') return false

    const { open, close } = dayHours
    // Simple time format validation: "HH:MM"
    const timeRegex = /^\d{2}:\d{2}$/
    return timeRegex.test(open) && timeRegex.test(close)
  })

  return validDays.length >= 3
}

/**
 * Validate and score a restaurant profile
 */
export function validateProfile(profile: ProfileResponse): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // ── Required field validation ────────────────────────────────────────────

  if (!profile.name || profile.name.trim().length < 2) {
    errors.push('Missing or invalid restaurant name')
  }

  if (!profile.cuisine_type || profile.cuisine_type.trim().length < 2) {
    errors.push('Missing cuisine type')
  }

  // ── Calculate confidence score ───────────────────────────────────────────

  const breakdown: ScoreBreakdown = {
    address: 0,
    phone: 0,
    website: 0,
    hours: 0,
    menu: 0,
    ambiance: 0,
    priceRange: 0,
    neighborhood: 0,
  }

  // Address: +20
  if (isValidHoustonAddress(profile.address)) {
    breakdown.address = 20
  } else if (profile.address) {
    warnings.push('Address may be incomplete or incorrect')
    breakdown.address = 10  // Partial credit
  }

  // Phone: +15
  if (isValidPhone(profile.phone)) {
    breakdown.phone = 15
  } else if (profile.phone) {
    warnings.push('Phone number format may be invalid')
    breakdown.phone = 5
  }

  // Website: +15
  if (isValidUrl(profile.website_url)) {
    breakdown.website = 15
  } else if (profile.website_url) {
    warnings.push('Website URL may be invalid')
    breakdown.website = 5
  }

  // Hours: +15
  if (hasValidHours(profile.hours)) {
    breakdown.hours = 15
  } else if (profile.hours && Object.keys(profile.hours).length > 0) {
    warnings.push('Hours information may be incomplete')
    breakdown.hours = 7
  }

  // Menu items (signature dishes): +10
  if (profile.signature_dishes && profile.signature_dishes.length >= 3) {
    breakdown.menu = 10
  } else if (profile.signature_dishes && profile.signature_dishes.length > 0) {
    breakdown.menu = 5
  }

  // Ambiance & features: +10
  const hasAmbiance = profile.ambiance && profile.ambiance.length > 0
  const hasFeatures = profile.features && profile.features.length > 0
  if (hasAmbiance && hasFeatures) {
    breakdown.ambiance = 10
  } else if (hasAmbiance || hasFeatures) {
    breakdown.ambiance = 5
  }

  // Price range: +10
  if (profile.price_range && VALID_PRICE_RANGES.has(profile.price_range)) {
    breakdown.priceRange = 10
  } else {
    warnings.push('Invalid or missing price range')
  }

  // Neighborhood: +5
  const normalizedNeighborhood = profile.neighborhood?.toLowerCase().trim() ?? ''
  if (KNOWN_NEIGHBORHOODS.has(normalizedNeighborhood)) {
    breakdown.neighborhood = 5
  } else if (profile.neighborhood) {
    warnings.push(`Neighborhood "${profile.neighborhood}" not in known list`)
    breakdown.neighborhood = 2
  }

  // ── Total confidence score ───────────────────────────────────────────────

  const confidenceScore =
    breakdown.address +
    breakdown.phone +
    breakdown.website +
    breakdown.hours +
    breakdown.menu +
    breakdown.ambiance +
    breakdown.priceRange +
    breakdown.neighborhood

  // ── Validate noise level ─────────────────────────────────────────────────

  if (profile.noise_level && !VALID_NOISE_LEVELS.has(profile.noise_level)) {
    warnings.push(`Invalid noise level: ${profile.noise_level}`)
  }

  // ── Determine status and featured eligibility ────────────────────────────

  let recommendedStatus: RestaurantStatus
  let featuredEligible: boolean

  if (confidenceScore >= 80) {
    recommendedStatus = 'active'
    featuredEligible = true
  } else if (confidenceScore >= 60) {
    recommendedStatus = 'active'
    featuredEligible = false
  } else {
    recommendedStatus = 'coming_soon'
    featuredEligible = false
    warnings.push('Low confidence score - flagged for manual review')
  }

  // ── Final validation ─────────────────────────────────────────────────────

  const isValid = errors.length === 0

  return {
    isValid,
    confidenceScore,
    recommendedStatus,
    featuredEligible,
    errors,
    warnings,
  }
}

/**
 * Generate slug from restaurant name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}
