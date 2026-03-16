// =============================================================================
// ExploreHTX — Weekly Digest Cron Job
// Sends the weekly event digest to all active, verified weekly subscribers.
//
// Usage (standalone Node.js after compilation):
//   node dist/src/cron/send-digest.js
// =============================================================================

import 'dotenv/config'

import { render } from '@react-email/components'
import WeeklyDigest from '../lib/email/templates/WeeklyDigest'
import type { DigestEvent, DigestBlogPost } from '../lib/email/templates/WeeklyDigest'
import { sendEmail } from '../lib/email/resend'
import { createAdminClient } from '../lib/supabase/admin'
import type { Subscriber, Event, BlogPost } from '../types/database'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 1000
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://explorehtx.us.com'
const MAX_EVENTS_PER_EMAIL = 8
const MAX_BLOG_POSTS = 3

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[send-digest] ${new Date().toISOString()} — ${msg}`)
}

function logError(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : String(err ?? '')
  console.error(
    `[send-digest] ERROR ${new Date().toISOString()} — ${msg}${detail ? `: ${detail}` : ''}`
  )
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function getWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  end.setHours(23, 59, 59, 999)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return { start, end, label: `${fmt(start)} – ${fmt(end)}` }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchUpcomingEvents(
  supabase: ReturnType<typeof createAdminClient>,
  start: Date,
  end: Date
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .gte('start_date', start.toISOString())
    .lte('start_date', end.toISOString())
    .order('featured', { ascending: false })
    .order('popularity_score', { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`)
  }

  return (data ?? []) as Event[]
}

async function fetchLatestBlogPosts(
  supabase: ReturnType<typeof createAdminClient>
): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(MAX_BLOG_POSTS)

  if (error) {
    throw new Error(`Failed to fetch blog posts: ${error.message}`)
  }

  return (data ?? []) as BlogPost[]
}

async function fetchActiveSubscribers(
  supabase: ReturnType<typeof createAdminClient>
): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('status', 'active')
    .eq('is_verified', true)
    .eq('frequency', 'weekly')

  if (error) {
    throw new Error(`Failed to fetch subscribers: ${error.message}`)
  }

  return (data ?? []) as Subscriber[]
}

// ---------------------------------------------------------------------------
// Event filtering per subscriber
// ---------------------------------------------------------------------------

function filterEventsForSubscriber(
  events: Event[],
  subscriber: Subscriber
): DigestEvent[] {
  let filtered = events

  // Filter by category preferences if the subscriber has any
  if (subscriber.categories.length > 0) {
    const preferred = filtered.filter((e) =>
      subscriber.categories.includes(e.category)
    )
    // Fall back to all events if none match their preferences
    filtered = preferred.length > 0 ? preferred : events
  }

  // Filter by neighborhood if the subscriber has preferences
  if (subscriber.neighborhoods.length > 0) {
    const nearby = filtered.filter(
      (e) => e.neighborhood && subscriber.neighborhoods.includes(e.neighborhood)
    )
    if (nearby.length > 0) {
      filtered = nearby
    }
  }

  return filtered.slice(0, MAX_EVENTS_PER_EMAIL).map(
    (e): DigestEvent => ({
      title: e.title,
      start_date: e.start_date,
      venue_name: e.venue_name,
      category: e.category,
      slug: e.slug,
      is_free: e.is_free,
      price_min: e.price_min,
      price_max: e.price_max,
    })
  )
}

// ---------------------------------------------------------------------------
// Email log helper
// ---------------------------------------------------------------------------

async function logEmailSent(
  supabase: ReturnType<typeof createAdminClient>,
  subscriberId: string,
  resendId: string | undefined,
  status: 'sent' | 'failed'
): Promise<void> {
  await supabase.from('email_logs').insert({
    subscriber_id: subscriberId,
    email_type: 'weekly_digest',
    resend_id: resendId ?? null,
    subject: 'This Week in Houston — ExploreHTX Weekly Digest',
    status,
    sent_at: new Date().toISOString(),
  })
}

// ---------------------------------------------------------------------------
// Send digest to a single subscriber
// ---------------------------------------------------------------------------

async function sendDigestToSubscriber(
  supabase: ReturnType<typeof createAdminClient>,
  subscriber: Subscriber,
  digestEvents: DigestEvent[],
  blogPostItems: DigestBlogPost[],
  dateRangeLabel: string
): Promise<{ success: boolean }> {
  const unsubscribeUrl = `${BASE_URL}/api/subscribe/unsubscribe?token=${subscriber.unsubscribe_token}`

  let html: string
  try {
    html = await render(
      WeeklyDigest({
        subscriberName: subscriber.name,
        events: digestEvents,
        blogPosts: blogPostItems,
        unsubscribeUrl,
        dateRange: dateRangeLabel,
      })
    )
  } catch (err) {
    logError(`Failed to render digest for ${subscriber.email}`, err)
    return { success: false }
  }

  const result = await sendEmail({
    to: subscriber.email,
    subject: `This Week in Houston — ${dateRangeLabel}`,
    html,
  })

  await logEmailSent(
    supabase,
    subscriber.id,
    result.id,
    result.success ? 'sent' : 'failed'
  )

  if (result.success) {
    await supabase
      .from('subscribers')
      .update({ last_email_sent_at: new Date().toISOString() })
      .eq('id', subscriber.id)
  } else {
    logError(`Failed to send digest to ${subscriber.email}`, result.error)
  }

  return { success: result.success }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function runDigest(): Promise<void> {
  const startTime = Date.now()
  log('Starting weekly digest run.')

  const supabase = createAdminClient()
  const { start, end, label } = getWeekRange()
  log(`Digest date range: ${label}`)

  // Fetch all required data in parallel
  const [events, blogPostRows, subscribers] = await Promise.all([
    fetchUpcomingEvents(supabase, start, end),
    fetchLatestBlogPosts(supabase),
    fetchActiveSubscribers(supabase),
  ])

  log(`Fetched ${events.length} events, ${blogPostRows.length} blog posts, ${subscribers.length} subscribers.`)

  if (subscribers.length === 0) {
    log('No active subscribers. Exiting.')
    process.exit(0)
  }

  const blogPostItems: DigestBlogPost[] = blogPostRows.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    slug: p.slug,
  }))

  // Process subscribers in batches
  let sent = 0
  let failed = 0
  const totalBatches = Math.ceil(subscribers.length / BATCH_SIZE)

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = subscribers.slice(
      batchIndex * BATCH_SIZE,
      (batchIndex + 1) * BATCH_SIZE
    )

    log(
      `Sending batch ${batchIndex + 1}/${totalBatches} (${batch.length} subscribers)…`
    )

    const batchResults = await Promise.allSettled(
      batch.map(async (subscriber) => {
        const digestEvents = filterEventsForSubscriber(events, subscriber)
        return sendDigestToSubscriber(
          supabase,
          subscriber,
          digestEvents,
          blogPostItems,
          label
        )
      })
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++
      } else {
        failed++
        if (result.status === 'rejected') {
          logError('Unexpected error sending to subscriber', result.reason)
        }
      }
    }

    // Delay between batches to respect rate limits
    if (batchIndex < totalBatches - 1) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  const durationMs = Date.now() - startTime
  log(
    `Digest run complete in ${durationMs}ms. Sent: ${sent}, Failed: ${failed}, Total: ${subscribers.length}.`
  )

  process.exit(0)
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

runDigest().catch((err) => {
  logError('Unhandled error in digest run', err)
  process.exit(1)
})
