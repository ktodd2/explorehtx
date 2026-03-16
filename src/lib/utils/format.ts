/**
 * Display formatting helpers for ExploreHTX.
 */

/**
 * Format a price range into a human-readable string.
 * Returns "Free" for free events, "$X" for single price, "$X–$Y" for ranges.
 */
export function formatPrice(
  min?: number | null,
  max?: number | null,
  isFree?: boolean
): string {
  if (isFree) return 'Free';

  if (min == null && max == null) return 'See details';

  if (min != null && min === 0 && max == null) return 'Free';
  if (min != null && min === 0 && max != null && max === 0) return 'Free';

  const fmt = (n: number) =>
    n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;

  if (min != null && max != null && min !== max) {
    return `${fmt(min)}–${fmt(max)}`;
  }

  if (min != null) return fmt(min);
  if (max != null) return fmt(max);

  return 'See details';
}

/**
 * Truncate a string to a maximum character length, appending "…" if cut.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Music & Concerts" → "music-concerts"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert a slug back to a display-friendly title.
 * e.g. "music-concerts" → "Music Concerts"
 */
export function unslugify(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Map a category slug to a full display name.
 * Falls back to unslugify if slug is not in the map.
 */
export function categoryDisplayName(slug: string): string {
  const map: Record<string, string> = {
    'music-concerts': 'Music & Concerts',
    'sports': 'Sports',
    'food-dining': 'Food & Dining',
    'arts-culture': 'Arts & Culture',
    'nightlife': 'Nightlife',
    'family-kids': 'Family & Kids',
    'outdoor-parks': 'Outdoor & Parks',
    'festivals': 'Festivals',
    'free-events': 'Free Events',
    'comedy': 'Comedy',
    'theater': 'Theater',
    'markets-shopping': 'Markets & Shopping',
    'community': 'Community',
    'wellness': 'Wellness & Fitness',
    'film': 'Film & Cinema',
    'education': 'Education',
    'business': 'Business & Networking',
    'charity': 'Charity & Causes',
  };

  return map[slug] ?? unslugify(slug);
}
