// =============================================================================
// ExploreHTX — AI Restaurant Discovery Cron Job
// Runs weekly to discover new Houston restaurants in rotating neighborhoods.
//
// Schedule: Sunday 6 PM CT (23:00 UTC) — once per week
//
// Usage (standalone Node.js after compilation):
//   node dist/cron/discover-restaurants.js
// =============================================================================

import 'dotenv/config'

import { createAdminClient } from '../lib/supabase/admin'
import { runDiscoveryPipeline } from '../lib/restaurants/discovery/researcher'
import { getWeeklyNeighborhood } from '../lib/restaurants/prompts/restaurant-research'
import type { Restaurant } from '../types/database'

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[discover-restaurants] ${new Date().toISOString()} — ${msg}`)
}

function logError(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : String(err ?? '')
  console.error(
    `[discover-restaurants] ERROR ${new Date().toISOString()} — ${msg}${detail ? `: ${detail}` : ''}`
  )
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function fetchAllRestaurants(
  supabase: ReturnType<typeof createAdminClient>
): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')

  if (error) {
    logError('Error fetching existing restaurants', error)
    return []
  }

  return (data as Restaurant[]) ?? []
}

async function insertIngestionLog(
  supabase: ReturnType<typeof createAdminClient>,
  startedAt: Date
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ingestion_logs')
    .insert({
      source: 'openai',
      job_type: 'restaurant_discovery',
      status: 'running',
      events_fetched: 0,
      events_created: 0,
      events_updated: 0,
      events_deduplicated: 0,
      started_at: startedAt.toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    logError('Failed to insert ingestion log', error)
    return null
  }

  return (data as { id: string }).id
}

async function completeIngestionLog(
  supabase: ReturnType<typeof createAdminClient>,
  logId: string,
  params: {
    status: 'completed' | 'failed'
    restaurantsCreated: number
    durationMs: number
    errorMessage?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('ingestion_logs')
    .update({
      status: params.status,
      events_fetched: params.restaurantsCreated,  // repurposed: candidates found
      events_created: params.restaurantsCreated,
      events_updated: 0,
      events_deduplicated: 0,
      duration_ms: params.durationMs,
      error_message: params.errorMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId)

  if (error) {
    logError('Failed to update ingestion log', error)
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function runRestaurantDiscovery(): Promise<void> {
  const startTime = Date.now()
  log('Starting restaurant discovery job...')

  const supabase = createAdminClient()
  const logId = await insertIngestionLog(supabase, new Date(startTime))

  try {
    // ── Determine which neighborhood to research ─────────────────────────────

    const { name: neighborhood, description: neighborhoodDescription } = getWeeklyNeighborhood()
    log(`This week's neighborhood: ${neighborhood}`)

    // ── Fetch existing restaurants for duplicate detection ───────────────────

    const existingRestaurants = await fetchAllRestaurants(supabase)
    log(`Found ${existingRestaurants.length} existing restaurants in database`)

    // ── Run the discovery pipeline ───────────────────────────────────────────

    const result = await runDiscoveryPipeline(
      neighborhood,
      neighborhoodDescription,
      existingRestaurants
    )

    log(`Discovery complete:`)
    log(`  Candidates found: ${result.candidatesFound}`)
    log(`  Unique (non-duplicate): ${result.uniqueCandidates}`)
    log(`  Profiles generated: ${result.profilesGenerated}`)
    log(`  Restaurants to insert: ${result.restaurantsCreated.length}`)

    if (result.errors.length > 0) {
      log(`  Errors: ${result.errors.length}`)
      result.errors.forEach(err => log(`    - ${err}`))
    }

    // ── Insert new restaurants into database ─────────────────────────────────

    let insertedCount = 0

    for (const { restaurant, validation } of result.restaurantsCreated) {
      try {
        const { error: insertError } = await supabase
          .from('restaurants')
          .insert(restaurant as Record<string, unknown>)

        if (insertError) {
          // Check if it's a duplicate slug error
          if (insertError.code === '23505') {
            log(`  Skipping ${restaurant.name}: slug already exists`)
            continue
          }
          throw insertError
        }

        insertedCount++
        log(`  Inserted: ${restaurant.name} (confidence: ${validation.confidenceScore}, status: ${restaurant.status})`)

      } catch (err) {
        logError(`Failed to insert ${restaurant.name}`, err)
      }
    }

    // ── Complete ingestion log ───────────────────────────────────────────────

    const durationMs = Date.now() - startTime

    log(`Restaurant discovery completed in ${durationMs}ms.`)
    log(`  Total inserted: ${insertedCount}`)

    if (logId) {
      await completeIngestionLog(supabase, logId, {
        status: 'completed',
        restaurantsCreated: insertedCount,
        durationMs,
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : undefined,
      })
    }

    // Summary by status
    const statusCounts = result.restaurantsCreated.reduce(
      (acc, { restaurant }) => {
        acc[restaurant.status] = (acc[restaurant.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    if (Object.keys(statusCounts).length > 0) {
      log(`  By status: ${Object.entries(statusCounts).map(([s, c]) => `${s}=${c}`).join(', ')}`)
    }

    process.exit(0)

  } catch (err) {
    const durationMs = Date.now() - startTime
    logError('Restaurant discovery failed', err)

    if (logId) {
      await completeIngestionLog(supabase, logId, {
        status: 'failed',
        restaurantsCreated: 0,
        durationMs,
        errorMessage: err instanceof Error ? err.message : String(err),
      })
    }

    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

runRestaurantDiscovery().catch((err) => {
  logError('Unhandled error in restaurant discovery run', err)
  process.exit(1)
})
