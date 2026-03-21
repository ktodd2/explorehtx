// =============================================================================
// ExploreHTX — AI Restaurant Researcher
// Two-phase discovery: identify candidates, then generate full profiles.
// =============================================================================

import { openai } from '../../openai/client'
import {
  buildDiscoveryPrompt,
  buildProfilePrompt,
  type DiscoveryCandidate,
  type DiscoveryResponse,
  type ProfileResponse,
  type DiscoveryPromptOptions,
} from '../prompts/restaurant-research'
import { validateProfile, generateSlug, type ValidationResult } from './validator'
import { filterDuplicates } from './deduplicator'
import type { Restaurant, InsertRestaurant } from '../../../types/database'

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[restaurant-researcher] ${new Date().toISOString()} — ${msg}`)
}

function logError(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : String(err ?? '')
  console.error(
    `[restaurant-researcher] ERROR ${new Date().toISOString()} — ${msg}${detail ? `: ${detail}` : ''}`
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResearchResult {
  candidate: DiscoveryCandidate
  profile: ProfileResponse
  validation: ValidationResult
  restaurant: InsertRestaurant
}

export interface DiscoveryResult {
  neighborhood: string
  candidatesFound: number
  uniqueCandidates: number
  profilesGenerated: number
  restaurantsCreated: ResearchResult[]
  errors: string[]
}

// ---------------------------------------------------------------------------
// Phase 1: Discover restaurant candidates
// ---------------------------------------------------------------------------

export async function discoverCandidates(
  options: DiscoveryPromptOptions
): Promise<DiscoveryCandidate[]> {
  const prompts = buildDiscoveryPrompt(options)

  log(`Discovering restaurants in ${options.neighborhood}...`)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [
      { role: 'system', content: prompts.system },
      { role: 'user', content: prompts.user },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) {
    throw new Error('OpenAI returned an empty response for discovery')
  }

  let parsed: DiscoveryResponse
  try {
    parsed = JSON.parse(rawContent) as DiscoveryResponse
  } catch (err) {
    throw new Error(`Failed to parse discovery response: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!Array.isArray(parsed.restaurants)) {
    throw new Error('Discovery response missing restaurants array')
  }

  log(`Discovered ${parsed.restaurants.length} candidates. Notes: ${parsed.research_notes ?? 'none'}`)

  return parsed.restaurants
}

// ---------------------------------------------------------------------------
// Phase 2: Generate full restaurant profile
// ---------------------------------------------------------------------------

export async function generateProfile(
  candidate: DiscoveryCandidate,
  neighborhood: string
): Promise<ProfileResponse> {
  const prompts = buildProfilePrompt({ candidate, neighborhood })

  log(`Generating profile for ${candidate.name}...`)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [
      { role: 'system', content: prompts.system },
      { role: 'user', content: prompts.user },
    ],
    temperature: 0.5,  // Lower temp for more consistent data
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) {
    throw new Error('OpenAI returned an empty response for profile')
  }

  let parsed: ProfileResponse
  try {
    parsed = JSON.parse(rawContent) as ProfileResponse
  } catch (err) {
    throw new Error(`Failed to parse profile response: ${err instanceof Error ? err.message : String(err)}`)
  }

  return parsed
}

// ---------------------------------------------------------------------------
// Convert profile to InsertRestaurant
// ---------------------------------------------------------------------------

function profileToInsertRestaurant(
  profile: ProfileResponse,
  validation: ValidationResult
): InsertRestaurant {
  const slug = generateSlug(profile.name)

  return {
    name: profile.name,
    slug,
    description: profile.description || null,

    // Location
    address: profile.address || null,
    neighborhood: profile.neighborhood || null,
    lat: null,  // Would need geocoding
    lng: null,

    // Contact
    phone: profile.phone || null,
    website_url: profile.website_url || null,
    reservation_url: profile.reservation_url || null,
    menu_url: profile.menu_url || null,

    // Cuisine
    cuisine_type: profile.cuisine_type,
    cuisine_tags: profile.cuisine_tags || [],

    // Pricing
    price_range: (profile.price_range as '$' | '$$' | '$$$' | '$$$$') || '$$',
    avg_price_per_person: profile.avg_price_per_person || null,

    // Hours
    hours: profile.hours || {},

    // Ambiance & Features
    ambiance: profile.ambiance || [],
    features: profile.features || [],
    dress_code: profile.dress_code || null,
    noise_level: (profile.noise_level as 'quiet' | 'moderate' | 'lively' | 'loud') || null,

    // Date Night
    date_night_labels: profile.date_night_labels || [],
    best_for: profile.best_for || [],

    // Menu
    signature_dishes: profile.signature_dishes || [],
    menu_highlights: profile.menu_highlights || {},

    // Media (placeholder - would need image sourcing)
    image_url: null,
    gallery_urls: [],

    // Metadata
    status: validation.recommendedStatus,
    featured: validation.featuredEligible,
    popularity_score: validation.confidenceScore,
    has_happy_hour: false,

    // Discovery tracking
    ai_generated: true,
    discovery_source: 'ai-research',
    confidence_score: validation.confidenceScore,
    last_featured_at: null,
  }
}

// ---------------------------------------------------------------------------
// Full discovery pipeline
// ---------------------------------------------------------------------------

export async function runDiscoveryPipeline(
  neighborhood: string,
  neighborhoodDescription: string,
  existingRestaurants: Restaurant[]
): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {
    neighborhood,
    candidatesFound: 0,
    uniqueCandidates: 0,
    profilesGenerated: 0,
    restaurantsCreated: [],
    errors: [],
  }

  try {
    // ── Phase 1: Discover candidates ─────────────────────────────────────────

    const excludeNames = existingRestaurants.map(r => r.name)

    const candidates = await discoverCandidates({
      neighborhood,
      neighborhoodDescription,
      excludeNames,
    })

    result.candidatesFound = candidates.length

    if (candidates.length === 0) {
      log(`No new candidates found in ${neighborhood}`)
      return result
    }

    // ── Filter duplicates ────────────────────────────────────────────────────

    const { unique, duplicates } = filterDuplicates(candidates, existingRestaurants)

    result.uniqueCandidates = unique.length

    if (duplicates.length > 0) {
      log(`Filtered ${duplicates.length} duplicates: ${duplicates.map(d => d.candidate.name).join(', ')}`)
    }

    if (unique.length === 0) {
      log('All candidates were duplicates')
      return result
    }

    // ── Phase 2: Generate profiles for unique candidates ─────────────────────

    // Limit to 5 profiles per run to manage API costs
    const toProcess = unique.slice(0, 5)

    for (const candidate of toProcess) {
      try {
        const profile = await generateProfile(candidate, neighborhood)
        const validation = validateProfile(profile)

        result.profilesGenerated++

        if (!validation.isValid) {
          result.errors.push(`${candidate.name}: ${validation.errors.join('; ')}`)
          continue
        }

        const restaurant = profileToInsertRestaurant(profile, validation)

        result.restaurantsCreated.push({
          candidate,
          profile,
          validation,
          restaurant,
        })

        log(
          `Created profile for ${candidate.name}: ` +
          `confidence=${validation.confidenceScore}, ` +
          `status=${validation.recommendedStatus}, ` +
          `featured=${validation.featuredEligible}`
        )

        if (validation.warnings.length > 0) {
          log(`  Warnings: ${validation.warnings.join('; ')}`)
        }

      } catch (err) {
        logError(`Failed to generate profile for ${candidate.name}`, err)
        result.errors.push(`${candidate.name}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

  } catch (err) {
    logError('Discovery pipeline failed', err)
    result.errors.push(`Pipeline error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return result
}
