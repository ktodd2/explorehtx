import type { Event, Restaurant } from '../../../types/database'

type ListicleType =
  | 'free-events'
  | 'family-events'
  | 'date-night'
  | 'outdoor-events'
  | 'food-events'
  | 'music-events'
  | 'arts-events'

interface ListiclePromptParams {
  type: ListicleType
  events: Event[]
  restaurants?: Restaurant[] // Optional restaurant data for date-night listicles
  dateRangeLabel: string // e.g. "March 2025" or "This Weekend"
}

interface PromptMessages {
  system: string
  user: string
}

const LISTICLE_CONFIG: Record<
  ListicleType,
  { titleTemplate: string; angle: string; keywords: string[] }
> = {
  'free-events': {
    titleTemplate: 'Best Free Events in Houston',
    angle: 'Budget-friendly Houstonians and visitors who want great experiences without spending a dime',
    keywords: ['free events Houston', 'free things to do in Houston', 'Houston free activities'],
  },
  'family-events': {
    titleTemplate: 'Top Family Events in Houston',
    angle: 'Parents and families with kids of all ages looking for memorable weekend activities',
    keywords: ['family events Houston', 'kid-friendly Houston', 'things to do with kids in Houston'],
  },
  'date-night': {
    titleTemplate: 'Best Date Night Ideas in Houston',
    angle: 'Couples looking for romantic, memorable, or fun shared experiences in the city — combining great restaurants with exciting events',
    keywords: ['date night Houston', 'romantic things to do Houston', 'couples activities Houston', 'romantic restaurants Houston', 'Houston date ideas'],
  },
  'outdoor-events': {
    titleTemplate: 'Best Outdoor Events in Houston',
    angle: 'Houstonians who want to get outside and enjoy the city\'s parks, trails, and outdoor venues',
    keywords: ['outdoor events Houston', 'Houston parks events', 'outdoor activities Houston'],
  },
  'food-events': {
    titleTemplate: 'Best Food Events in Houston',
    angle: 'Foodies and culinary adventurers who want to explore Houston\'s world-class dining scene',
    keywords: ['food events Houston', 'Houston food festivals', 'Houston culinary events'],
  },
  'music-events': {
    titleTemplate: 'Best Live Music Events in Houston',
    angle: 'Music lovers seeking concerts, performances, and live entertainment across all genres',
    keywords: ['live music Houston', 'Houston concerts', 'Houston music events'],
  },
  'arts-events': {
    titleTemplate: 'Best Arts & Culture Events in Houston',
    angle: 'Culture seekers who want to explore Houston\'s museums, galleries, theater, and creative scene',
    keywords: ['arts events Houston', 'Houston culture', 'Houston museum events', 'Houston theater'],
  },
}

/**
 * Build the system + user prompt for a Houston listicle post.
 * Target: 700–1000 words, numbered list format, SEO-optimized.
 */
export function buildListiclePrompt(params: ListiclePromptParams): PromptMessages {
  const { type, events, restaurants, dateRangeLabel } = params
  const config = LISTICLE_CONFIG[type]

  const eventSummaries = events
    .slice(0, 20)
    .map((e, i) => {
      const price = e.is_free ? 'Free' : e.price_min != null ? `From $${e.price_min}` : 'Varies'
      const venue = e.venue_name ? ` at ${e.venue_name}` : ''
      const neighborhood = e.neighborhood ? ` — ${e.neighborhood}` : ''
      const date = new Date(e.start_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Chicago',
      })
      return `${i + 1}. ${e.title}${venue}${neighborhood} | ${date} | ${price}`
    })
    .join('\n')

  // Build restaurant summaries if provided (for date-night listicles)
  let restaurantSummaries = ''
  if (restaurants && restaurants.length > 0) {
    restaurantSummaries = restaurants
      .slice(0, 10)
      .map((r, i) => {
        const labels = r.date_night_labels.slice(0, 2).join(', ')
        const signature = r.signature_dishes.slice(0, 2).join(', ')
        return `${i + 1}. ${r.name} (${r.cuisine_type}) — ${r.neighborhood ?? 'Houston'} | ${r.price_range} | ${labels || 'Great for dates'}${signature ? ` | Try: ${signature}` : ''}`
      })
      .join('\n')
  }

  const system = `You are an expert Houston city guide writer for ExploreHTX.
You write punchy, useful listicles that rank well on Google and genuinely help readers discover the best of Houston.
Your tone is friendly, knowledgeable, and enthusiastic — you make every option sound worth doing.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) using this exact schema:
{
  "title": "string — the post headline",
  "excerpt": "string — 150–160 character meta description / post summary",
  "content": "string — full markdown post body",
  "keywords": ["array", "of", "seo", "keywords"],
  "tags": ["array", "of", "short", "topic", "tags"]
}`

  // Special handling for date-night with restaurants
  const hasRestaurants = restaurants && restaurants.length > 0

  let user: string
  if (type === 'date-night' && hasRestaurants) {
    user = `Write a listicle blog post titled "${config.titleTemplate}: ${dateRangeLabel}" for ExploreHTX.

Target audience: ${config.angle}

RESTAURANTS to recommend (include these as dinner suggestions):
${restaurantSummaries}

EVENTS to pair with dinner (suggest event + restaurant combos where neighborhoods align):
${eventSummaries}

Requirements:
- Title: "${config.titleTemplate}: ${dateRangeLabel}" (or a more click-worthy variation with a number)
- Length: 800–1100 words
- Format:
  - Brief intro paragraph on Houston's incredible date night scene
  - Mix of restaurant + event pairings as numbered items (## 1. Dinner at [Restaurant] + [Event])
  - For each combo: why it works, what to order, practical tips
  - A few standalone restaurant picks for couples who just want dinner
  - Brief closing encouraging readers to explore the restaurants page
- Tone: Romantic but practical — help couples plan a memorable night
- Include internal links: link restaurant names to /restaurants/[slug] (use the restaurant name lowercased with hyphens)
- Add "Pro Tips" for reservations, dress code, or neighborhood parking
- End with a "Subscribe to ExploreHTX" CTA
- Include 5–8 SEO keywords: ${config.keywords.join(', ')}
- Include 4–6 tags`
  } else {
    user = `Write a listicle blog post titled "${config.titleTemplate}: ${dateRangeLabel}" for ExploreHTX.

Target audience: ${config.angle}

Events to feature:
${eventSummaries}

Requirements:
- Title: "${config.titleTemplate}: ${dateRangeLabel}" (or a more click-worthy variation with a number, e.g. "12 Best Free Events in Houston This Month")
- Length: 700–1000 words
- Format:
  - Brief intro paragraph (2–3 sentences on why Houston is great for this category)
  - Numbered list (## 1. Event Name) with 2–4 sentences per item explaining what it is, why it's worth attending, and practical details
  - Brief closing paragraph encouraging readers to explore more
- Tone: Enthusiastic and concrete — tell readers specifically WHY each pick is great
- Add a "Pro Tip" or neighborhood context where helpful
- End with a "Subscribe to ExploreHTX" CTA for weekly Houston event updates
- Include 5–8 SEO keywords: ${config.keywords.join(', ')}
- Include 4–6 tags`
  }

  return { system, user }
}

export type { ListicleType }
