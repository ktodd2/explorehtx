// =============================================================================
// ExploreHTX — Neighborhood Geocoder
// Maps a lat/lng (or address string) to a Houston neighborhood slug.
// =============================================================================

// ---------------------------------------------------------------------------
// Neighborhood centroids
// ---------------------------------------------------------------------------

interface NeighborhoodCentroid {
  slug: string
  lat: number
  lng: number
}

/**
 * Approximate center points for Houston-area neighborhoods.
 * Coordinates sourced from well-known landmarks / geographic centers.
 */
const NEIGHBORHOODS: NeighborhoodCentroid[] = [
  { slug: 'downtown',           lat: 29.7604, lng: -95.3698 },
  { slug: 'midtown',            lat: 29.7430, lng: -95.3872 },
  { slug: 'montrose',           lat: 29.7460, lng: -95.3930 },
  { slug: 'the-heights',        lat: 29.7910, lng: -95.3975 },
  { slug: 'museum-district',    lat: 29.7233, lng: -95.3905 },
  { slug: 'rice-village',       lat: 29.7172, lng: -95.4100 },
  { slug: 'river-oaks',         lat: 29.7570, lng: -95.4260 },
  { slug: 'galleria-uptown',    lat: 29.7370, lng: -95.4613 },
  { slug: 'east-end-eado',      lat: 29.7480, lng: -95.3420 },
  { slug: 'washington-avenue',  lat: 29.7710, lng: -95.3860 },
  { slug: 'memorial-park',      lat: 29.7648, lng: -95.4345 },
  { slug: 'medical-center',     lat: 29.7066, lng: -95.3986 },
  { slug: 'chinatown-bellaire', lat: 29.7072, lng: -95.5250 },
  { slug: 'katy',               lat: 29.7858, lng: -95.8245 },
  { slug: 'sugar-land',         lat: 29.6197, lng: -95.6349 },
  { slug: 'the-woodlands',      lat: 30.1658, lng: -95.4613 },
  { slug: 'clear-lake-nasa',    lat: 29.5474, lng: -95.1132 },
  { slug: 'pearland',           lat: 29.5638, lng: -95.2860 },
]

/** Maximum search radius in miles. Events further away get no neighborhood. */
const MAX_RADIUS_MILES = 5

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

const EARTH_RADIUS_MILES = 3_958.8

/** Haversine distance between two lat/lng points, in miles. */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a))
}

// ---------------------------------------------------------------------------
// Address-string fallback
// ---------------------------------------------------------------------------

/**
 * Attempt to extract a neighborhood slug directly from an address string.
 * Scans for neighborhood name fragments (case-insensitive) in the address.
 */
function neighborhoodFromAddress(address: string): string | null {
  const lc = address.toLowerCase()

  // Map of address fragments → neighborhood slugs.
  // More specific strings must come before shorter/overlapping ones.
  const ADDRESS_HINTS: [string, string][] = [
    ['the woodlands',         'the-woodlands'],
    ['sugar land',            'sugar-land'],
    ['sugarland',             'sugar-land'],
    ['clear lake',            'clear-lake-nasa'],
    ['pearland',              'pearland'],
    ['katy',                  'katy'],
    ['galleria',              'galleria-uptown'],
    ['uptown',                'galleria-uptown'],
    ['river oaks',            'river-oaks'],
    ['river-oaks',            'river-oaks'],
    ['memorial park',         'memorial-park'],
    ['museum district',       'museum-district'],
    ['medical center',        'medical-center'],
    ['med center',            'medical-center'],
    ['texas medical',         'medical-center'],
    ['rice village',          'rice-village'],
    ['east end',              'east-end-eado'],
    ['eado',                  'east-end-eado'],
    ['east downtown',         'east-end-eado'],
    ['washington ave',        'washington-avenue'],
    ['washington avenue',     'washington-avenue'],
    ['the heights',           'the-heights'],
    ['heights',               'the-heights'],
    ['midtown',               'midtown'],
    ['montrose',              'montrose'],
    ['chinatown',             'chinatown-bellaire'],
    ['bellaire',              'chinatown-bellaire'],
    ['downtown',              'downtown'],
  ]

  for (const [fragment, slug] of ADDRESS_HINTS) {
    if (lc.includes(fragment)) return slug
  }

  return null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Given optional coordinates and/or an address string, return the closest
 * Houston neighborhood slug (within 5 miles), or null if none qualifies.
 *
 * Strategy:
 * 1. If lat/lng are provided, find the nearest centroid within MAX_RADIUS_MILES.
 * 2. Otherwise, scan the address string for known neighborhood name fragments.
 */
export function assignNeighborhood(
  lat?: number,
  lng?: number,
  address?: string
): string | null {
  // ------------------------------------------------------------------
  // Path 1: coordinates available — use nearest-centroid
  // ------------------------------------------------------------------
  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    let closestSlug: string | null = null
    let closestDistance = Infinity

    for (const neighborhood of NEIGHBORHOODS) {
      const dist = haversineDistance(lat, lng, neighborhood.lat, neighborhood.lng)
      if (dist < closestDistance) {
        closestDistance = dist
        closestSlug = neighborhood.slug
      }
    }

    if (closestDistance <= MAX_RADIUS_MILES) {
      return closestSlug
    }

    // Coordinates are outside all known neighborhoods — still try address fallback.
  }

  // ------------------------------------------------------------------
  // Path 2: no usable coordinates — parse address string
  // ------------------------------------------------------------------
  if (address) {
    return neighborhoodFromAddress(address)
  }

  return null
}
