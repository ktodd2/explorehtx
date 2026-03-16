/**
 * Date utility functions for ExploreHTX event pages.
 * All date range helpers return ISO 8601 strings suitable for Supabase queries.
 */

/**
 * Format an ISO date string as a human-readable event date.
 * e.g. "Sat, Mar 21 at 7:00 PM"
 */
export function formatEventDate(date: string): string {
  const d = new Date(date);
  const isAllDay =
    d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;

  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });

  if (isAllDay) return datePart;

  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  });

  return `${datePart} at ${timePart}`;
}

/**
 * Format a start + optional end date as a display range.
 * e.g. "Sat, Mar 21 at 7:00 PM – 10:00 PM"
 */
export function formatDateRange(start: string, end?: string): string {
  const formatted = formatEventDate(start);
  if (!end) return formatted;

  const startD = new Date(start);
  const endD = new Date(end);

  // Same day — only show end time
  const sameDay =
    startD.toDateString() === endD.toDateString();

  if (sameDay) {
    const endTime = endD.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });
    return `${formatted} – ${endTime}`;
  }

  return `${formatted} – ${formatEventDate(end)}`;
}

/**
 * Return the start/end ISO strings spanning all of today (Central time, UTC-aware).
 */
export function getToday(): { start: string; end: string } {
  const now = new Date();
  const cst = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = cst.find((p) => p.type === 'year')!.value;
  const month = cst.find((p) => p.type === 'month')!.value;
  const day = cst.find((p) => p.type === 'day')!.value;

  const start = new Date(`${year}-${month}-${day}T00:00:00-06:00`).toISOString();
  const end = new Date(`${year}-${month}-${day}T23:59:59-06:00`).toISOString();

  return { start, end };
}

/**
 * Return the ISO start/end for the upcoming Saturday and Sunday.
 * If today is Saturday, starts today. If today is Sunday, spans only today.
 */
export function getThisWeekend(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat

  const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (dayOfWeek === 6 ? 0 : daysUntilSaturday));

  const sunday = new Date(now);
  sunday.setDate(now.getDate() + (dayOfWeek === 0 ? 0 : daysUntilSunday));

  const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const start = new Date(`${toDateStr(saturday)}T00:00:00-06:00`).toISOString();
  const end = new Date(`${toDateStr(sunday)}T23:59:59-06:00`).toISOString();

  return { start, end };
}

/**
 * Return ISO start/end spanning Monday through Sunday of the current week,
 * starting from today if today is past Monday.
 */
export function getThisWeek(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun

  // Start from today
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  // End on Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const end = new Date(now);
  end.setDate(now.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Return ISO start/end spanning the first and last day of the current calendar month.
 */
export function getThisMonth(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Check whether a given ISO date string falls on today (Central time).
 */
export function isToday(date: string): boolean {
  const { start, end } = getToday();
  const d = new Date(date);
  return d >= new Date(start) && d <= new Date(end);
}

/**
 * Check whether a given ISO date string falls on this weekend.
 */
export function isThisWeekend(date: string): boolean {
  const { start, end } = getThisWeekend();
  const d = new Date(date);
  return d >= new Date(start) && d <= new Date(end);
}
