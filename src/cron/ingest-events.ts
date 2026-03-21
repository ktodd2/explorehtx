// =============================================================================
// ExploreHTX — Event Ingestion Cron Job
// Runs every 6 hours via Render cron. Fetches, processes, and upserts events.
//
// Usage (standalone Node.js after compilation):
//   node dist/src/cron/ingest-events.js
// =============================================================================

import 'dotenv/config'

import { TicketmasterAdapter }    from '../lib/events/adapters/ticketmaster'
import { EventbriteAdapter }     from '../lib/events/adapters/eventbrite'
import { MeetupAdapter }         from '../lib/events/adapters/meetup'
import { VisitHoustonAdapter }   from '../lib/events/adapters/visit-houston'
import { CultureMapAdapter }     from '../lib/events/adapters/culturemap'
import { Do713Adapter }          from '../lib/events/adapters/do713'
import { MuseumDistrictAdapter } from '../lib/events/adapters/museum-district'
import { HoustonPressAdapter }   from '../lib/events/adapters/houston-press'
import { PredictHQAdapter }      from '../lib/events/adapters/predicthq'
import { FacebookEventsAdapter } from '../lib/events/adapters/facebook-events'
import type { NormalizedEvent }     from '../lib/events/adapters/base'
import { deduplicateEvents }   from '../lib/events/deduplicator'
import { categorizeEvent }     from '../lib/events/categorizer'
import { assignNeighborhood }  from '../lib/events/geocoder'
import { generateEventSlug }   from '../lib/events/slugifier'
import { createAdminClient }   from '../lib/supabase/admin'
import type { InsertEvent }         from '../types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IngestionResult {
  source: string
  fetched: number
  error?: string
}

interface UpsertCounts {
  created: number
  updated: number
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[ingest-events] ${new Date().toISOString()} — ${msg}`)
}

function logError(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : String(err ?? '')
  console.error(`[ingest-events] ERROR ${new Date().toISOString()} — ${msg}${detail ? `: ${detail}` : ''}`)
}

// ---------------------------------------------------------------------------
// Ingestion log helpers
// ---------------------------------------------------------------------------

async function insertIngestionLogStart(
  supabase: ReturnType<typeof createAdminClient>,
  startedAt: Date
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ingestion_logs')
    .insert({
      source: 'all',
      job_type: 'scheduled_ingest',
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
    logError('Failed to insert ingestion log start record', error)
    return null
  }

  return (data as { id: string }).id
}

async function updateIngestionLogComplete(
  supabase: ReturnType<typeof createAdminClient>,
  logId: string,
  params: {
    status: 'completed' | 'failed'
    eventsFetched: number
    eventsCreated: number
    eventsUpdated: number
    eventsDeduplicated: number
    durationMs: number
    errorMessage?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('ingestion_logs')
    .update({
      status: params.status,
      events_fetched: params.eventsFetched,
      events_created: params.eventsCreated,
      events_updated: params.eventsUpdated,
      events_deduplicated: params.eventsDeduplicated,
      duration_ms: params.durationMs,
      error_message: params.errorMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId)

  if (error) {
    logError('Failed to update ingestion log completion record', error)
  }
}

// ---------------------------------------------------------------------------
// Event transformation: NormalizedEvent → InsertEvent
// ---------------------------------------------------------------------------

function toInsertEvent(event: NormalizedEvent, category: string, neighborhood: string | null): InsertEvent {
  const slug = generateEventSlug(event.title, event.startDate, event.externalId)

  return {
    external_id:    event.externalId,
    source:         event.source,
    source_url:     event.sourceUrl,
    title:          event.title,
    slug,
    description:    event.description || null,
    description_html: null,
    start_date:     event.startDate,
    end_date:       event.endDate ?? null,
    is_all_day:     event.isAllDay ?? false,
    venue_id:       null,
    venue_name:     event.venueName ?? null,
    venue_address:  event.venueAddress ?? null,
    venue_lat:      event.lat ?? null,
    venue_lng:      event.lng ?? null,
    neighborhood,
    category,
    tags:           event.tags ?? [],
    image_url:      event.imageUrl ?? null,
    image_alt:      event.imageAlt ?? null,
    price_min:      event.priceMin ?? null,
    price_max:      event.priceMax ?? null,
    is_free:        event.isFree ?? false,
    ticket_url:     event.ticketUrl ?? null,
    organizer_name: event.organizerName ?? null,
    status:         'active',
    featured:       false,
    popularity_score: 0,
    raw_data:       event.rawData,
  }
}

// ---------------------------------------------------------------------------
// Supabase upsert
// ---------------------------------------------------------------------------

/**
 * Upsert a batch of events into Supabase.
 * Matches on (source, external_id). Returns created/updated counts.
 *
 * We use `ignoreDuplicates: false` so existing rows are updated with the
 * latest data on conflict.
 */
async function upsertEvents(
  supabase: ReturnType<typeof createAdminClient>,
  records: InsertEvent[]
): Promise<UpsertCounts> {
  if (records.length === 0) return { created: 0, updated: 0 }

  // Supabase JS v2 upsert returns the affected rows. We split created vs
  // updated by checking whether `created_at` equals `updated_at` on each row.
  const { data, error } = await supabase
    .from('events')
    .upsert(records, {
      onConflict: 'source,external_id',
      ignoreDuplicates: false,
    })
    .select('id, created_at, updated_at')

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`)
  }

  const rows = (data ?? []) as Array<{ id: string; created_at: string; updated_at: string }>

  let created = 0
  let updated = 0
  for (const row of rows) {
    // If created_at and updated_at are within 1 second, treat as a new insert.
    const diff = Math.abs(
      new Date(row.updated_at).getTime() - new Date(row.created_at).getTime()
    )
    if (diff < 1000) {
      created++
    } else {
      updated++
    }
  }

  return { created, updated }
}

// ---------------------------------------------------------------------------
// Main ingestion orchestrator
// ---------------------------------------------------------------------------

async function runIngestion(): Promise<void> {
  const startTime = Date.now()
  log('Starting event ingestion run.')

  const supabase = createAdminClient()

  // Log start to ingestion_logs.
  const logId = await insertIngestionLogStart(supabase, new Date(startTime))

  // ------------------------------------------------------------------
  // Step 1: Fetch from all adapters in parallel.
  // ------------------------------------------------------------------
  const adapters = [
    new TicketmasterAdapter(),
    new EventbriteAdapter(),
    new MeetupAdapter(),
    new VisitHoustonAdapter(),
    new CultureMapAdapter(),
    new Do713Adapter(),
    new MuseumDistrictAdapter(),
    new HoustonPressAdapter(),
    new PredictHQAdapter(),
    new FacebookEventsAdapter(),
  ]

  log(`Running ${adapters.length} adapter(s) in parallel...`)

  const adapterResults = await Promise.allSettled(
    adapters.map(async (adapter): Promise<IngestionResult & { events: NormalizedEvent[] }> => {
      log(`[${adapter.source}] Fetching events...`)
      try {
        const events = await adapter.fetch()
        log(`[${adapter.source}] Fetched ${events.length} events.`)
        return { source: adapter.source, fetched: events.length, events }
      } catch (err) {
        logError(`[${adapter.source}] Adapter fetch failed`, err)
        return { source: adapter.source, fetched: 0, events: [], error: String(err) }
      }
    })
  )

  // Collect all events, tolerating individual adapter failures.
  let allEvents: NormalizedEvent[] = []
  const adapterErrors: string[] = []

  for (const result of adapterResults) {
    if (result.status === 'fulfilled') {
      allEvents = allEvents.concat(result.value.events)
      if (result.value.error) {
        adapterErrors.push(`${result.value.source}: ${result.value.error}`)
      }
    } else {
      logError('Unexpected adapter promise rejection', result.reason)
      adapterErrors.push(String(result.reason))
    }
  }

  const totalFetched = allEvents.length
  log(`Total events fetched across all adapters: ${totalFetched}`)

  if (totalFetched === 0) {
    log('No events to process. Logging completion and exiting.')
    if (logId) {
      await updateIngestionLogComplete(supabase, logId, {
        status: 'completed',
        eventsFetched: 0,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeduplicated: 0,
        durationMs: Date.now() - startTime,
        errorMessage: adapterErrors.length > 0 ? adapterErrors.join('; ') : undefined,
      })
    }
    process.exit(0)
  }

  // ------------------------------------------------------------------
  // Step 2: Deduplicate.
  // ------------------------------------------------------------------
  log('Running deduplicator...')
  const deduplicated = deduplicateEvents(allEvents)
  const deduplicatedCount = totalFetched - deduplicated.length
  log(`Deduplication removed ${deduplicatedCount} duplicate(s). ${deduplicated.length} events remaining.`)

  // ------------------------------------------------------------------
  // Steps 3–5: Categorize, geocode, slugify, and build DB records.
  // ------------------------------------------------------------------
  log('Categorizing, geocoding, and building DB records...')

  // Filter out events with missing or empty dates (prevents DB timestamp errors)
  const validEvents = deduplicated.filter((event) => {
    if (!event.startDate || event.startDate.trim() === '') {
      log(`Skipping event "${event.title}" from ${event.source}: missing startDate`)
      return false
    }
    return true
  })

  if (validEvents.length < deduplicated.length) {
    log(`Filtered out ${deduplicated.length - validEvents.length} event(s) with invalid dates.`)
  }

  const insertRecords: InsertEvent[] = validEvents.map((event) => {
    const category     = categorizeEvent(event)
    const neighborhood = assignNeighborhood(event.lat, event.lng, event.venueAddress)
    const record = toInsertEvent(event, category, neighborhood)
    // Ensure empty strings don't get sent as timestamps
    if (record.end_date === '') record.end_date = null
    return record
  })

  log(`Prepared ${insertRecords.length} records for upsert.`)

  // ------------------------------------------------------------------
  // Step 6: Upsert into Supabase in batches to avoid request size limits.
  // ------------------------------------------------------------------
  const BATCH_SIZE = 100
  let totalCreated = 0
  let totalUpdated = 0
  let upsertErrorMessage: string | undefined

  log(`Upserting in batches of ${BATCH_SIZE}...`)

  for (let i = 0; i < insertRecords.length; i += BATCH_SIZE) {
    const batch = insertRecords.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(insertRecords.length / BATCH_SIZE)

    try {
      const { created, updated } = await upsertEvents(supabase, batch)
      totalCreated += created
      totalUpdated += updated
      log(`Batch ${batchNum}/${totalBatches}: ${created} created, ${updated} updated.`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logError(`Batch ${batchNum}/${totalBatches} upsert failed`, err)
      upsertErrorMessage = upsertErrorMessage ? `${upsertErrorMessage}; ${msg}` : msg
    }
  }

  // ------------------------------------------------------------------
  // Step 7: Log completion.
  // ------------------------------------------------------------------
  const durationMs = Date.now() - startTime
  const allErrors = [
    ...(adapterErrors.length > 0 ? adapterErrors : []),
    ...(upsertErrorMessage ? [upsertErrorMessage] : []),
  ]

  log(
    `Ingestion complete in ${durationMs}ms. ` +
    `Fetched: ${totalFetched}, Deduplicated: ${deduplicatedCount}, ` +
    `Created: ${totalCreated}, Updated: ${totalUpdated}.`
  )

  if (logId) {
    await updateIngestionLogComplete(supabase, logId, {
      status: allErrors.length > 0 && totalCreated + totalUpdated === 0 ? 'failed' : 'completed',
      eventsFetched: totalFetched,
      eventsCreated: totalCreated,
      eventsUpdated: totalUpdated,
      eventsDeduplicated: deduplicatedCount,
      durationMs,
      errorMessage: allErrors.length > 0 ? allErrors.join('; ') : undefined,
    })
  }

  process.exit(0)
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

runIngestion().catch((err) => {
  logError('Unhandled error in ingestion run', err)
  process.exit(1)
})
