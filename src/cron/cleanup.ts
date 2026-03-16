// =============================================================================
// ExploreHTX — Database Cleanup Cron Job
// Runs every Sunday at 3 AM CT via Render cron.
//
// Performs four housekeeping tasks:
//   1. Archive events whose end_date is more than 30 days in the past.
//   2. Delete ingestion_logs older than 90 days.
//   3. Delete email_logs older than 90 days.
//   4. Delete unverified subscribers older than 7 days.
//
// Usage (standalone Node.js after compilation):
//   node dist/cron/cleanup.js
// =============================================================================

import 'dotenv/config'

import { createAdminClient } from '../lib/supabase/admin'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARCHIVE_EVENTS_AFTER_DAYS    = 30
const DELETE_INGESTION_LOGS_AFTER_DAYS = 90
const DELETE_EMAIL_LOGS_AFTER_DAYS = 90
const DELETE_UNVERIFIED_AFTER_DAYS = 7

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[cleanup] ${new Date().toISOString()} — ${msg}`)
}

function logError(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : String(err ?? '')
  console.error(`[cleanup] ERROR ${new Date().toISOString()} — ${msg}${detail ? `: ${detail}` : ''}`)
}

// ---------------------------------------------------------------------------
// Date helper
// ---------------------------------------------------------------------------

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Task 1: Archive stale events
// ---------------------------------------------------------------------------

async function archiveStaleEvents(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  const cutoff = daysAgo(ARCHIVE_EVENTS_AFTER_DAYS)

  // Archive events where end_date has passed the cutoff.
  // If end_date is null, fall back to start_date so single-day events
  // that are well in the past are also archived.
  const { data, error } = await supabase
    .from('events')
    .update({ status: 'archived' })
    .in('status', ['active', 'cancelled', 'postponed'])
    .or(`end_date.lt.${cutoff},and(end_date.is.null,start_date.lt.${cutoff})`)
    .select('id')

  if (error) {
    throw new Error(`Failed to archive stale events: ${error.message}`)
  }

  return (data ?? []).length
}

// ---------------------------------------------------------------------------
// Task 2: Delete old ingestion logs
// ---------------------------------------------------------------------------

async function deleteOldIngestionLogs(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  const cutoff = daysAgo(DELETE_INGESTION_LOGS_AFTER_DAYS)

  const { data, error } = await supabase
    .from('ingestion_logs')
    .delete()
    .lt('started_at', cutoff)
    .select('id')

  if (error) {
    throw new Error(`Failed to delete old ingestion logs: ${error.message}`)
  }

  return (data ?? []).length
}

// ---------------------------------------------------------------------------
// Task 3: Delete old email logs
// ---------------------------------------------------------------------------

async function deleteOldEmailLogs(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  const cutoff = daysAgo(DELETE_EMAIL_LOGS_AFTER_DAYS)

  const { data, error } = await supabase
    .from('email_logs')
    .delete()
    .lt('sent_at', cutoff)
    .select('id')

  if (error) {
    throw new Error(`Failed to delete old email logs: ${error.message}`)
  }

  return (data ?? []).length
}

// ---------------------------------------------------------------------------
// Task 4: Delete unverified subscribers
// ---------------------------------------------------------------------------

async function deleteUnverifiedSubscribers(
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  const cutoff = daysAgo(DELETE_UNVERIFIED_AFTER_DAYS)

  const { data, error } = await supabase
    .from('subscribers')
    .delete()
    .eq('is_verified', false)
    .lt('created_at', cutoff)
    .select('id')

  if (error) {
    throw new Error(`Failed to delete unverified subscribers: ${error.message}`)
  }

  return (data ?? []).length
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function runCleanup(): Promise<void> {
  const startTime = Date.now()
  log('Starting cleanup run.')

  const supabase = createAdminClient()

  const results = {
    eventsArchived: 0,
    ingestionLogsDeleted: 0,
    emailLogsDeleted: 0,
    unverifiedSubscribersDeleted: 0,
    errors: [] as string[],
  }

  // Run all tasks sequentially to avoid overwhelming the database.

  // Task 1: Archive stale events
  try {
    results.eventsArchived = await archiveStaleEvents(supabase)
    log(`Archived ${results.eventsArchived} stale event(s) (end_date > ${ARCHIVE_EVENTS_AFTER_DAYS} days ago).`)
  } catch (err) {
    logError('Task 1 (archive events) failed', err)
    results.errors.push(err instanceof Error ? err.message : String(err))
  }

  // Task 2: Delete old ingestion logs
  try {
    results.ingestionLogsDeleted = await deleteOldIngestionLogs(supabase)
    log(`Deleted ${results.ingestionLogsDeleted} ingestion log(s) older than ${DELETE_INGESTION_LOGS_AFTER_DAYS} days.`)
  } catch (err) {
    logError('Task 2 (delete ingestion logs) failed', err)
    results.errors.push(err instanceof Error ? err.message : String(err))
  }

  // Task 3: Delete old email logs
  try {
    results.emailLogsDeleted = await deleteOldEmailLogs(supabase)
    log(`Deleted ${results.emailLogsDeleted} email log(s) older than ${DELETE_EMAIL_LOGS_AFTER_DAYS} days.`)
  } catch (err) {
    logError('Task 3 (delete email logs) failed', err)
    results.errors.push(err instanceof Error ? err.message : String(err))
  }

  // Task 4: Delete unverified subscribers
  try {
    results.unverifiedSubscribersDeleted = await deleteUnverifiedSubscribers(supabase)
    log(`Deleted ${results.unverifiedSubscribersDeleted} unverified subscriber(s) older than ${DELETE_UNVERIFIED_AFTER_DAYS} days.`)
  } catch (err) {
    logError('Task 4 (delete unverified subscribers) failed', err)
    results.errors.push(err instanceof Error ? err.message : String(err))
  }

  const durationMs = Date.now() - startTime

  if (results.errors.length > 0) {
    logError(
      `Cleanup run completed with ${results.errors.length} error(s) in ${durationMs}ms. ` +
      `Events archived: ${results.eventsArchived}, Ingestion logs deleted: ${results.ingestionLogsDeleted}, ` +
      `Email logs deleted: ${results.emailLogsDeleted}, Unverified subscribers deleted: ${results.unverifiedSubscribersDeleted}.`
    )
    process.exit(1)
  }

  log(
    `Cleanup run complete in ${durationMs}ms. ` +
    `Events archived: ${results.eventsArchived}, Ingestion logs deleted: ${results.ingestionLogsDeleted}, ` +
    `Email logs deleted: ${results.emailLogsDeleted}, Unverified subscribers deleted: ${results.unverifiedSubscribersDeleted}.`
  )

  process.exit(0)
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

runCleanup().catch((err) => {
  logError('Unhandled error in cleanup run', err)
  process.exit(1)
})
