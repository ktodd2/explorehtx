// =============================================================================
// ExploreHTX — AI Restaurant Research Prompts
// Two-phase discovery: identify candidates, then generate full profiles.
// =============================================================================

/**
 * Houston neighborhoods for restaurant discovery rotation
 */
export const DISCOVERY_NEIGHBORHOODS = [
  { name: 'Montrose', description: 'Eclectic dining scene with trendy restaurants and diverse cuisines' },
  { name: 'The Heights', description: 'Charming neighborhood restaurants, farm-to-table spots, and local favorites' },
  { name: 'Downtown', description: 'Upscale dining, power lunch spots, and pre-theater destinations' },
  { name: 'Midtown', description: 'Vibrant nightlife dining, cocktail bars with food, and late-night eats' },
  { name: 'River Oaks', description: 'Refined dining, special occasion restaurants, and elegant cafes' },
  { name: 'East End', description: 'Authentic Mexican, innovative fusion, and emerging culinary scene' },
  { name: 'Museum District', description: 'Cultural dining, sophisticated bistros, and museum cafes' },
  { name: 'Galleria', description: 'Upscale chains, international cuisines, and business dining' },
  { name: 'Rice Village', description: 'College-adjacent dining, diverse quick bites, and casual spots' },
  { name: 'Washington Avenue', description: 'Bar-restaurants, brunch spots, and nightlife-adjacent dining' },
  { name: 'Upper Kirby', description: 'Refined neighborhood dining, date night spots, and local chains' },
  { name: 'Memorial', description: 'Family-friendly dining, suburban favorites, and established spots' },
  { name: 'Spring Branch', description: 'Authentic ethnic cuisines, Korean BBQ, and Vietnamese gems' },
  { name: 'Chinatown', description: 'Authentic Asian cuisines, dim sum, pho, and pan-Asian variety' },
  { name: 'EaDo', description: 'Emerging dining scene near stadiums, craft breweries with food' },
] as const

export type DiscoveryNeighborhood = typeof DISCOVERY_NEIGHBORHOODS[number]

/**
 * Get the neighborhood to research based on week number
 */
export function getWeeklyNeighborhood(): DiscoveryNeighborhood {
  const weekOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  return DISCOVERY_NEIGHBORHOODS[weekOfYear % DISCOVERY_NEIGHBORHOODS.length]
}

/**
 * Phase 1 prompt: Discover restaurant candidates in a neighborhood
 */
export interface DiscoveryPromptOptions {
  neighborhood: string
  neighborhoodDescription: string
  excludeNames: string[]  // Names of restaurants already in DB
}

export function buildDiscoveryPrompt(options: DiscoveryPromptOptions): {
  system: string
  user: string
} {
  const { neighborhood, neighborhoodDescription, excludeNames } = options

  const excludeList = excludeNames.length > 0
    ? `\n\nALREADY IN DATABASE (exclude these):\n${excludeNames.map(n => `- ${n}`).join('\n')}`
    : ''

  const system = `You are a Houston restaurant expert helping ExploreHTX discover new dining destinations.
You have deep knowledge of Houston's restaurant scene, including hidden gems, new openings, and local favorites.
Your recommendations are based on quality, uniqueness, and appeal for date nights and special occasions.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) using this schema:
{
  "restaurants": [
    {
      "name": "Restaurant Name",
      "cuisine_type": "Primary cuisine (e.g., Italian, Mexican, Steakhouse)",
      "address": "Full street address in Houston",
      "why_notable": "2-3 sentence explanation of what makes this place special",
      "price_range": "$" | "$$" | "$$$" | "$$$$",
      "best_for": ["first-date", "anniversary", "casual-date", "special-occasion"]
    }
  ],
  "research_notes": "Brief notes on the neighborhood's current dining trends"
}`

  const user = `Research ${neighborhood} in Houston for date-night worthy restaurants.

NEIGHBORHOOD CONTEXT:
${neighborhoodDescription}

REQUIREMENTS:
- Find 5-8 restaurants that would make great date night destinations
- Focus on quality, atmosphere, and romantic appeal
- Include a mix of cuisines and price points
- Prioritize places with:
  - Intimate or special ambiance
  - Quality food and service reputation
  - Good for conversation (not too loud)
  - Interesting or unique offerings
- Avoid chains unless they're truly exceptional
- Include new openings (last 1-2 years) if notable${excludeList}

Provide accurate Houston addresses. Focus on restaurants that are currently operating.`

  return { system, user }
}

/**
 * Candidate from Phase 1 discovery
 */
export interface DiscoveryCandidate {
  name: string
  cuisine_type: string
  address: string
  why_notable: string
  price_range: string
  best_for: string[]
}

/**
 * Phase 1 response shape
 */
export interface DiscoveryResponse {
  restaurants: DiscoveryCandidate[]
  research_notes: string
}

/**
 * Phase 2 prompt: Generate full restaurant profile
 */
export interface ProfilePromptOptions {
  candidate: DiscoveryCandidate
  neighborhood: string
}

export function buildProfilePrompt(options: ProfilePromptOptions): {
  system: string
  user: string
} {
  const { candidate, neighborhood } = options

  const system = `You are a Houston restaurant data specialist for ExploreHTX.
You generate comprehensive, accurate restaurant profiles for the database.
Your profiles help Houstonians discover perfect date night spots.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) using this EXACT schema:
{
  "name": "Official restaurant name",
  "description": "2-3 engaging sentences about the restaurant, its concept, and what makes it special",
  "address": "Full street address, Houston, TX 77XXX",
  "neighborhood": "${neighborhood}",
  "phone": "713-XXX-XXXX or null if unknown",
  "website_url": "https://... or null if unknown",
  "reservation_url": "Resy/OpenTable URL or null if not available",
  "menu_url": "URL to menu page or null",
  "cuisine_type": "Primary cuisine category",
  "cuisine_tags": ["tag1", "tag2", "tag3"],
  "price_range": "$" | "$$" | "$$$" | "$$$$",
  "avg_price_per_person": 45,
  "hours": {
    "monday": {"open": "11:00", "close": "22:00"},
    "tuesday": {"open": "11:00", "close": "22:00"},
    "wednesday": {"open": "11:00", "close": "22:00"},
    "thursday": {"open": "11:00", "close": "22:00"},
    "friday": {"open": "11:00", "close": "23:00"},
    "saturday": {"open": "11:00", "close": "23:00"},
    "sunday": {"open": "11:00", "close": "21:00"}
  },
  "ambiance": ["romantic", "intimate", "upscale"],
  "features": ["bar", "outdoor-seating", "private-dining"],
  "dress_code": "smart-casual",
  "noise_level": "moderate",
  "date_night_labels": ["Perfect for First Dates", "Anniversary Worthy"],
  "best_for": ["first-date", "anniversary", "special-occasion"],
  "signature_dishes": ["Dish 1", "Dish 2", "Dish 3"],
  "menu_highlights": {
    "appetizers": ["Item 1", "Item 2"],
    "mains": ["Item 1", "Item 2"],
    "desserts": ["Item 1"]
  }
}`

  const user = `Generate a complete restaurant profile for "${candidate.name}" in ${neighborhood}.

WHAT WE KNOW:
- Cuisine: ${candidate.cuisine_type}
- Address: ${candidate.address}
- Price Range: ${candidate.price_range}
- Why Notable: ${candidate.why_notable}
- Best For: ${candidate.best_for.join(', ')}

REQUIREMENTS:
- Use accurate information if known, reasonable estimates if not
- Hours should reflect typical Houston restaurant hours for this type
- Include 3-5 signature dishes that represent the restaurant
- Ambiance tags: choose from romantic, intimate, upscale, casual, trendy, cozy, lively, refined, hip, elegant
- Features: choose from bar, outdoor-seating, private-dining, live-music, chef-table, wine-program, cocktail-program, valet-parking, patio
- Noise level: quiet, moderate, lively, or loud
- Date night labels: "Perfect for First Dates", "Anniversary Worthy", "Special Occasion", "Casual Date Night", "Impressive Date", "Late Night Romance", "Foodie Date"

Generate the most complete and accurate profile possible.`

  return { system, user }
}

/**
 * Full profile response shape (matches Restaurant schema)
 */
export interface ProfileResponse {
  name: string
  description: string
  address: string
  neighborhood: string
  phone: string | null
  website_url: string | null
  reservation_url: string | null
  menu_url: string | null
  cuisine_type: string
  cuisine_tags: string[]
  price_range: string
  avg_price_per_person: number | null
  hours: Record<string, { open: string; close: string }>
  ambiance: string[]
  features: string[]
  dress_code: string | null
  noise_level: string | null
  date_night_labels: string[]
  best_for: string[]
  signature_dishes: string[]
  menu_highlights: Record<string, string[]>
}
