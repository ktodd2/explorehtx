import type { Event, Restaurant } from '../../../types/database'

interface DateNightGuideParams {
  restaurants: Restaurant[]
  events: Event[]
  dateRangeLabel: string // e.g. "March 2025" or "This Weekend"
}

interface PromptMessages {
  system: string
  user: string
}

/**
 * Build the system + user prompt for a comprehensive Houston date night guide.
 * Combines restaurant recommendations with event pairings.
 * Target: 1000–1400 words, neighborhood-organized, SEO-optimized.
 */
export function buildDateNightGuidePrompt(params: DateNightGuideParams): PromptMessages {
  const { restaurants, events, dateRangeLabel } = params

  // Build restaurant summaries grouped by neighborhood
  const restaurantsByNeighborhood: Record<string, Restaurant[]> = {}
  for (const r of restaurants) {
    const hood = r.neighborhood || 'Houston'
    if (!restaurantsByNeighborhood[hood]) restaurantsByNeighborhood[hood] = []
    restaurantsByNeighborhood[hood].push(r)
  }

  const restaurantSummaries = Object.entries(restaurantsByNeighborhood)
    .map(([neighborhood, list]) => {
      const items = list
        .slice(0, 5)
        .map((r) => {
          const labels = r.date_night_labels.slice(0, 2).join(', ')
          const signature = r.signature_dishes.slice(0, 2).join(', ')
          const reservations = r.reservation_url ? 'Takes reservations' : 'Walk-ins OK'
          return `  - ${r.name} (${r.cuisine_type}, ${r.price_range}): ${labels || 'Great date spot'}. ${signature ? `Try: ${signature}. ` : ''}${reservations}.`
        })
        .join('\n')
      return `${neighborhood}:\n${items}`
    })
    .join('\n\n')

  // Build event summaries grouped by type
  const eventSummaries = events
    .slice(0, 15)
    .map((e) => {
      const price = e.is_free ? 'Free' : e.price_min != null ? `From $${e.price_min}` : 'Varies'
      const venue = e.venue_name || e.neighborhood || 'Houston'
      const date = new Date(e.start_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Chicago',
      })
      return `- ${e.title} at ${venue} | ${date} | ${price}`
    })
    .join('\n')

  const system = `You are an expert Houston city guide writer for ExploreHTX, specializing in date night planning.
You write engaging, practical guides that help couples plan memorable evenings in Houston.
Your tone is romantic but not cheesy — warm, knowledgeable, and helpful with real insider tips.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) using this exact schema:
{
  "title": "string — the post headline",
  "excerpt": "string — 150–160 character meta description / post summary",
  "content": "string — full markdown post body",
  "keywords": ["array", "of", "seo", "keywords"],
  "tags": ["array", "of", "short", "topic", "tags"]
}`

  const user = `Write a comprehensive date night guide for Houston titled "Houston Date Night Guide: ${dateRangeLabel}" for ExploreHTX.

RESTAURANTS (organized by neighborhood):
${restaurantSummaries}

UPCOMING EVENTS to pair with dinner:
${eventSummaries}

Requirements:
- Title: "Houston Date Night Guide: ${dateRangeLabel}" (or variation like "The Ultimate Houston Date Night Guide for ${dateRangeLabel}")
- Length: 1000–1400 words
- Format:
  1. **Intro** (2–3 sentences): Set the romantic scene, mention Houston's diverse dining and entertainment
  2. **By Occasion** sections:
     - "Anniversary & Special Occasions" — upscale picks with event pairings
     - "First Date Ideas" — approachable spots that spark conversation
     - "Casual Date Night" — laid-back options for couples who want quality time
     - "Late Night Romance" — for dates that start after 9 PM
  3. Each section should:
     - Recommend 2–3 restaurants with specific dishes to order
     - Suggest an event pairing when neighborhoods align (e.g., "Start with dinner at X, then walk to Y for the show")
     - Include practical tips (dress code, reservation advice, parking)
  4. **Pro Tips** callout box with 3–4 Houston-specific date night tips
  5. **Closing** encouraging readers to explore /restaurants/date-night for the full list

- Internal links:
  - Link restaurant names to /restaurants/[slug] (slugified: lowercase, hyphens)
  - Link to /events for the events calendar
  - Link to /restaurants/date-night for the full date night restaurant list
- Tone: Helpful and romantic — like getting advice from a well-traveled Houston friend
- Include 6–10 SEO keywords: date night Houston, romantic restaurants Houston, Houston date ideas, couples activities Houston, best Houston restaurants for couples, romantic things to do Houston
- Include 5–7 tags`

  return { system, user }
}
