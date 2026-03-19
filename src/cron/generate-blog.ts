// =============================================================================
// ExploreHTX — AI Blog Generation Cron Job
// Runs on a schedule to produce AI-generated blog posts about Houston events.
//
// Schedule: twice daily (5 AM CT / 5 PM CT)
//   AM run (primary content):
//     Monday        → weekly preview
//     Thursday      → weekend roundup
//     1st of month  → monthly roundup
//     Other days    → neighborhood guide
//   PM run (secondary content):
//     Always a listicle (rotates through types daily)
//
// Usage (standalone Node.js after compilation):
//   node dist/src/cron/generate-blog.js
// =============================================================================

import 'dotenv/config'
import { createHash }                   from 'crypto'

import { createAdminClient }            from '../lib/supabase/admin'
import { generateBlogPost }             from '../lib/openai/generate-post'
import { buildWeeklyPreviewPrompt }     from '../lib/openai/prompts/weekly-preview'
import { buildWeekendRoundupPrompt }    from '../lib/openai/prompts/weekend-roundup'
import {
  buildNeighborhoodGuidePrompt,
  HOUSTON_NEIGHBORHOODS,
}                                       from '../lib/openai/prompts/neighborhood-guide'
import { buildListiclePrompt }          from '../lib/openai/prompts/listicle'
import type { Event, InsertBlogPost }   from '../types/database'
import type { ListicleType }            from '../lib/openai/prompts/listicle'

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[generate-blog] ${new Date().toISOString()} — ${msg}`)
}

function logError(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : String(err ?? '')
  console.error(
    `[generate-blog] ERROR ${new Date().toISOString()} — ${msg}${detail ? `: ${detail}` : ''}`
  )
}

// ---------------------------------------------------------------------------
// Date helpers (Houston Central Time)
// ---------------------------------------------------------------------------

function getCentralDate(d: Date = new Date()): {
  year: number
  month: number
  day: number
  dayOfWeek: number  // 0=Sun, 1=Mon … 6=Sat
  hour: number       // 0-23 in Central Time
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(d)

  const year   = parseInt(parts.find((p) => p.type === 'year')!.value, 10)
  const month  = parseInt(parts.find((p) => p.type === 'month')!.value, 10) // 1-based
  const day    = parseInt(parts.find((p) => p.type === 'day')!.value, 10)
  const hour   = parseInt(parts.find((p) => p.type === 'hour')!.value, 10)

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const weekdayStr = parts.find((p) => p.type === 'weekday')!.value.slice(0, 3)
  const dayOfWeek = weekdayMap[weekdayStr] ?? d.getDay()

  return { year, month, day, dayOfWeek, hour }
}

/** Format a date range label: "March 17–23, 2025" */
function formatDateRangeLabel(start: Date, end: Date): string {
  const startFmt = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  })
  const endFmt = end.toLocaleDateString('en-US', {
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  })
  return `${startFmt}–${endFmt}`
}

/** Format a month label: "March 2025" */
function formatMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Next Saturday at midnight CT */
function getUpcomingWeekendRange(): { start: Date; end: Date; label: string } {
  const now = new Date()
  const { dayOfWeek } = getCentralDate(now)

  const daysToSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek)
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysToSat)

  const sun = new Date(sat)
  sun.setDate(sat.getDate() + 1)

  // Range: Saturday 00:00 CT → Sunday 23:59 CT
  const startISO = new Date(`${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(sat.getDate()).padStart(2, '0')}T00:00:00-06:00`)
  const endISO   = new Date(`${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}T23:59:59-06:00`)

  const label = formatDateRangeLabel(sat, sun)
  return { start: startISO, end: endISO, label }
}

/** This week: today through next Sunday */
function getThisWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date()
  const { dayOfWeek } = getCentralDate(now)

  const daysToSun = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const sun = new Date(now)
  sun.setDate(now.getDate() + daysToSun)

  const label = formatDateRangeLabel(now, sun)
  return { start: now, end: sun, label }
}

/** This calendar month */
function getThisMonthRange(): { start: Date; end: Date; label: string } {
  const now = new Date()
  const { year, month } = getCentralDate(now)
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 0, 23, 59, 59)
  const label = formatMonthLabel(year, month)
  return { start, end, label }
}

// ---------------------------------------------------------------------------
// Supabase event fetch helpers
// ---------------------------------------------------------------------------

async function fetchEventsInRange(
  supabase: ReturnType<typeof createAdminClient>,
  start: Date,
  end: Date,
  limit = 30
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .gte('start_date', start.toISOString())
    .lte('start_date', end.toISOString())
    .order('popularity_score', { ascending: false })
    .limit(limit)

  if (error) {
    logError('Error fetching events in range', error)
    return []
  }

  return (data as Event[]) ?? []
}

async function fetchEventsByNeighborhood(
  supabase: ReturnType<typeof createAdminClient>,
  neighborhood: string,
  limit = 15
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .eq('neighborhood', neighborhood)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) {
    logError(`Error fetching events for neighborhood: ${neighborhood}`, error)
    return []
  }

  return (data as Event[]) ?? []
}

async function fetchEventsByCategory(
  supabase: ReturnType<typeof createAdminClient>,
  category: string,
  limit = 20
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .eq('category', category)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) {
    logError(`Error fetching events for category: ${category}`, error)
    return []
  }

  return (data as Event[]) ?? []
}

async function fetchFreeEvents(
  supabase: ReturnType<typeof createAdminClient>,
  limit = 20
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .eq('is_free', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) {
    logError('Error fetching free events', error)
    return []
  }

  return (data as Event[]) ?? []
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

async function postHashExists(
  supabase: ReturnType<typeof createAdminClient>,
  hash: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('ai_prompt_hash', hash)
    .maybeSingle()

  if (error) {
    logError('Error checking prompt hash', error)
    return false
  }

  return data !== null
}

// ---------------------------------------------------------------------------
// Ingestion log helpers
// ---------------------------------------------------------------------------

async function insertIngestionLog(
  supabase: ReturnType<typeof createAdminClient>,
  startedAt: Date
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ingestion_logs')
    .insert({
      source: 'openai',
      job_type: 'blog_generation',
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
    eventsCreated: number
    durationMs: number
    errorMessage?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('ingestion_logs')
    .update({
      status: params.status,
      events_fetched: params.eventsCreated,  // repurposed: posts generated
      events_created: params.eventsCreated,
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
// Rotation helpers (for alternating neighborhood / listicle on "other" days)
// ---------------------------------------------------------------------------

const LISTICLE_ROTATION: ListicleType[] = [
  'free-events',
  'family-events',
  'date-night',
  'outdoor-events',
  'food-events',
  'music-events',
  'arts-events',
]

/**
 * Determine the rotation index based on the day of year, so it advances
 * predictably without needing persistent state.
 */
function getDayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

function getNeighborhoodRotationIndex(d: Date = new Date()): number {
  return getDayOfYear(d) % HOUSTON_NEIGHBORHOODS.length
}

function getListicleRotationIndex(d: Date = new Date()): number {
  return getDayOfYear(d) % LISTICLE_ROTATION.length
}

// ---------------------------------------------------------------------------
// Generation job types
// ---------------------------------------------------------------------------

type JobType =
  | 'weekly-preview'
  | 'weekend-roundup'
  | 'monthly-roundup'
  | 'neighborhood-guide'
  | 'listicle'

function determineJobType(centralDate: ReturnType<typeof getCentralDate>): JobType {
  const isAM = centralDate.hour < 12

  if (isAM) {
    // ── Morning run: primary content ──────────────────────────────────────
    // 1st of month → monthly roundup (highest priority)
    if (centralDate.day === 1) return 'monthly-roundup'
    // Monday → weekly preview
    if (centralDate.dayOfWeek === 1) return 'weekly-preview'
    // Thursday → weekend roundup
    if (centralDate.dayOfWeek === 4) return 'weekend-roundup'
    // All other days → neighborhood guide
    return 'neighborhood-guide'
  }

  // ── Afternoon run: always a listicle (rotates daily) ─────────────────
  return 'listicle'
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function runBlogGeneration(): Promise<void> {
  const startTime = Date.now()
  const now = new Date()
  const centralDate = getCentralDate(now)

  log(`Starting blog generation. Central date: ${centralDate.year}-${centralDate.month}-${centralDate.day} (dayOfWeek: ${centralDate.dayOfWeek}, hour: ${centralDate.hour}, run: ${centralDate.hour < 12 ? 'AM' : 'PM'})`)

  const supabase = createAdminClient()
  const logId = await insertIngestionLog(supabase, new Date(startTime))

  const jobType = determineJobType(centralDate)
  log(`Determined job type: ${jobType}`)

  let post: InsertBlogPost | null = null

  try {
    // ── Build prompts + fetch events based on job type ─────────────────────

    if (jobType === 'weekly-preview') {
      const { start, end, label } = getThisWeekRange()
      const events = await fetchEventsInRange(supabase, start, end)
      log(`Fetched ${events.length} events for weekly preview (${label})`)

      const prompts = buildWeeklyPreviewPrompt({ events, dateRangeLabel: label })
      const isDuplicate = await postHashExists(supabase, createHash('sha256').update(`${prompts.system}\n---\n${prompts.user}`).digest('hex'))
      if (isDuplicate) {
        log('Duplicate post detected (matching prompt hash). Skipping.')
        if (logId) await completeIngestionLog(supabase, logId, { status: 'completed', eventsCreated: 0, durationMs: Date.now() - startTime })
        process.exit(0)
      }

      post = await generateBlogPost({
        postType: 'weekend_roundup',  // reuse type for weekly listings
        prompts,
        relatedEventIds: events.slice(0, 10).map((e) => e.id),
      })
    }

    else if (jobType === 'weekend-roundup') {
      const { start, end, label } = getUpcomingWeekendRange()
      const events = await fetchEventsInRange(supabase, start, end)
      log(`Fetched ${events.length} events for weekend roundup (${label})`)

      const prompts = buildWeekendRoundupPrompt({ events, dateRangeLabel: label })
      const hash = createHash('sha256').update(`${prompts.system}\n---\n${prompts.user}`).digest('hex')
      if (await postHashExists(supabase, hash)) {
        log('Duplicate post detected. Skipping.')
        if (logId) await completeIngestionLog(supabase, logId, { status: 'completed', eventsCreated: 0, durationMs: Date.now() - startTime })
        process.exit(0)
      }

      post = await generateBlogPost({
        postType: 'weekend_roundup',
        prompts,
        relatedEventIds: events.slice(0, 10).map((e) => e.id),
      })
    }

    else if (jobType === 'monthly-roundup') {
      const { start, end, label } = getThisMonthRange()
      const events = await fetchEventsInRange(supabase, start, end, 40)
      log(`Fetched ${events.length} events for monthly roundup (${label})`)

      const prompts = buildWeeklyPreviewPrompt({
        events,
        dateRangeLabel: label,
        isMonthly: true,
        monthLabel: label,
      })
      const hash = createHash('sha256').update(`${prompts.system}\n---\n${prompts.user}`).digest('hex')
      if (await postHashExists(supabase, hash)) {
        log('Duplicate post detected. Skipping.')
        if (logId) await completeIngestionLog(supabase, logId, { status: 'completed', eventsCreated: 0, durationMs: Date.now() - startTime })
        process.exit(0)
      }

      post = await generateBlogPost({
        postType: 'seasonal_guide',
        prompts,
        relatedEventIds: events.slice(0, 10).map((e) => e.id),
        category: 'monthly-roundup',
      })
    }

    else if (jobType === 'neighborhood-guide') {
      const idx = getNeighborhoodRotationIndex(now)
      const { name: neighborhood, description: areaDescription } = HOUSTON_NEIGHBORHOODS[idx]
      log(`Neighborhood spotlight: ${neighborhood}`)

      const events = await fetchEventsByNeighborhood(supabase, neighborhood)
      log(`Fetched ${events.length} events in ${neighborhood}`)

      const prompts = buildNeighborhoodGuidePrompt({ neighborhood, areaDescription, events })
      const hash = createHash('sha256').update(`${prompts.system}\n---\n${prompts.user}`).digest('hex')
      if (await postHashExists(supabase, hash)) {
        log('Duplicate post detected. Skipping.')
        if (logId) await completeIngestionLog(supabase, logId, { status: 'completed', eventsCreated: 0, durationMs: Date.now() - startTime })
        process.exit(0)
      }

      post = await generateBlogPost({
        postType: 'neighborhood_guide',
        prompts,
        relatedEventIds: events.slice(0, 8).map((e) => e.id),
        category: neighborhood.toLowerCase().replace(/\s+/g, '-'),
      })
    }

    else {
      // listicle
      const listicleType = LISTICLE_ROTATION[getListicleRotationIndex(now)]
      log(`Listicle type: ${listicleType}`)

      let events: Event[] = []
      const dateRangeLabel = formatMonthLabel(centralDate.year, centralDate.month)

      if (listicleType === 'free-events') {
        events = await fetchFreeEvents(supabase)
      } else if (listicleType === 'family-events') {
        events = await fetchEventsByCategory(supabase, 'family-kids')
      } else if (listicleType === 'date-night') {
        // Mix of nightlife + food for date night
        const [nightlife, food] = await Promise.all([
          fetchEventsByCategory(supabase, 'nightlife', 10),
          fetchEventsByCategory(supabase, 'food-dining', 10),
        ])
        events = [...nightlife, ...food].slice(0, 20)
      } else if (listicleType === 'outdoor-events') {
        events = await fetchEventsByCategory(supabase, 'outdoor-parks')
      } else if (listicleType === 'food-events') {
        events = await fetchEventsByCategory(supabase, 'food-dining')
      } else if (listicleType === 'music-events') {
        events = await fetchEventsByCategory(supabase, 'music-concerts')
      } else {
        // arts-events
        events = await fetchEventsByCategory(supabase, 'arts-culture')
      }

      log(`Fetched ${events.length} events for listicle (${listicleType})`)

      const prompts = buildListiclePrompt({ type: listicleType, events, dateRangeLabel })
      const hash = createHash('sha256').update(`${prompts.system}\n---\n${prompts.user}`).digest('hex')
      if (await postHashExists(supabase, hash)) {
        log('Duplicate post detected. Skipping.')
        if (logId) await completeIngestionLog(supabase, logId, { status: 'completed', eventsCreated: 0, durationMs: Date.now() - startTime })
        process.exit(0)
      }

      post = await generateBlogPost({
        postType: 'listicle',
        prompts,
        relatedEventIds: events.slice(0, 10).map((e) => e.id),
        category: listicleType,
      })
    }

    // ── Insert the generated post into Supabase ────────────────────────────
    if (!post) throw new Error('Post generation returned null unexpectedly')

    log(`Generated post: "${post.title}" (${post.word_count} words, ${post.reading_time_minutes} min read)`)

    const { error: insertError } = await supabase
      .from('blog_posts')
      .insert(post as Record<string, unknown>)

    if (insertError) {
      throw new Error(`Failed to insert blog post: ${insertError.message}`)
    }

    const durationMs = Date.now() - startTime
    log(`Blog post published successfully in ${durationMs}ms.`)

    if (logId) {
      await completeIngestionLog(supabase, logId, {
        status: 'completed',
        eventsCreated: 1,
        durationMs,
      })
    }

    process.exit(0)

  } catch (err) {
    const durationMs = Date.now() - startTime
    logError('Blog generation failed', err)

    if (logId) {
      await completeIngestionLog(supabase, logId, {
        status: 'failed',
        eventsCreated: 0,
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

runBlogGeneration().catch((err) => {
  logError('Unhandled error in blog generation run', err)
  process.exit(1)
})
