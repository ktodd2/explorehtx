import type { RestaurantHours, AttractionHours } from '@/types/database';

type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const DAYS: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Get current day of week in Houston time
 */
function getHoustonTime(): { day: DayOfWeek; hours: number; minutes: number } {
  // Houston is in America/Chicago timezone
  const now = new Date();
  const houstonTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));

  return {
    day: DAYS[houstonTime.getDay()],
    hours: houstonTime.getHours(),
    minutes: houstonTime.getMinutes(),
  };
}

/**
 * Parse time string like "09:00" or "9:00 AM" to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;

  const normalized = timeStr.trim().toLowerCase();

  // Handle 24-hour format (e.g., "14:30")
  const match24 = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  // Handle 12-hour format (e.g., "2:30 PM", "2:30pm")
  const match12 = normalized.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const isPM = match12[3] === 'pm';

    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Check if current Houston time is within operating hours
 */
function isWithinHours(
  openTime: string,
  closeTime: string,
  currentHours: number,
  currentMinutes: number
): boolean {
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);

  if (openMinutes === null || closeMinutes === null) return false;

  const currentMinutesSinceMidnight = currentHours * 60 + currentMinutes;

  // Handle overnight hours (e.g., open 6pm close 2am)
  if (closeMinutes <= openMinutes) {
    // Either we're after opening OR before closing (next day)
    return currentMinutesSinceMidnight >= openMinutes || currentMinutesSinceMidnight < closeMinutes;
  }

  // Normal hours (e.g., open 9am close 5pm)
  return currentMinutesSinceMidnight >= openMinutes && currentMinutesSinceMidnight < closeMinutes;
}

/**
 * Check if a restaurant is currently open
 */
export function isRestaurantOpen(hours: RestaurantHours | null | undefined): boolean {
  if (!hours || Object.keys(hours).length === 0) return false;

  const { day, hours: currentHours, minutes } = getHoustonTime();
  const todayHours = hours[day];

  if (!todayHours?.open || !todayHours?.close) return false;

  return isWithinHours(todayHours.open, todayHours.close, currentHours, minutes);
}

/**
 * Check if an attraction is currently open
 */
export function isAttractionOpen(hours: AttractionHours | null | undefined): boolean {
  if (!hours || Object.keys(hours).length === 0) return false;

  const { day, hours: currentHours, minutes } = getHoustonTime();
  const todayHours = hours[day];

  if (!todayHours?.open || !todayHours?.close) return false;

  return isWithinHours(todayHours.open, todayHours.close, currentHours, minutes);
}

/**
 * Get formatted hours for today
 */
export function getTodayHours(hours: RestaurantHours | AttractionHours | null | undefined): string | null {
  if (!hours || Object.keys(hours).length === 0) return null;

  const { day } = getHoustonTime();
  const todayHours = hours[day];

  if (!todayHours?.open || !todayHours?.close) return null;

  return `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`;
}

/**
 * Format time for display (e.g., "14:00" -> "2:00 PM")
 */
export function formatTime(timeStr: string): string {
  const minutes = parseTimeToMinutes(timeStr);
  if (minutes === null) return timeStr;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  if (mins === 0) {
    return `${displayHours} ${period}`;
  }
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get the current day name for display
 */
export function getCurrentDay(): string {
  const { day } = getHoustonTime();
  return day.charAt(0).toUpperCase() + day.slice(1);
}

/**
 * Check if hours indicate always open (24/7)
 */
export function isAlwaysOpen(hours: RestaurantHours | AttractionHours | null | undefined): boolean {
  if (!hours) return false;

  return DAYS.every((day) => {
    const dayHours = hours[day];
    if (!dayHours) return false;

    const open = parseTimeToMinutes(dayHours.open);
    const close = parseTimeToMinutes(dayHours.close);

    // Check for 24-hour patterns like 00:00-23:59 or 00:00-00:00
    return (open === 0 && close === 23 * 60 + 59) || (open === 0 && close === 0);
  });
}
