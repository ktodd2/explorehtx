import type { Attraction, AttractionCategory, Event } from '../../../types/database'

interface AttractionSpotlightParams {
  attraction: Attraction
  category: AttractionCategory | null
  nearbyEvents?: Event[]
}

interface PromptMessages {
  system: string
  user: string
}

/**
 * Build the system + user prompt for an attraction spotlight blog post.
 * Deep-dive into a single Houston attraction with history, tips, and recommendations.
 * Target: 800–1200 words, visitor-focused, SEO-optimized.
 */
export function buildAttractionSpotlightPrompt(params: AttractionSpotlightParams): PromptMessages {
  const { attraction, category, nearbyEvents = [] } = params

  // Build features summary
  const featuresText = attraction.features.length > 0
    ? attraction.features.map((f) => f.replace(/-/g, ' ')).join(', ')
    : 'various amenities'

  // Build best for summary
  const bestForText = attraction.best_for.length > 0
    ? attraction.best_for.map((b) => b.replace(/-/g, ' ')).join(', ')
    : 'all visitors'

  // Build accessibility summary
  const accessibilityText = attraction.accessibility.length > 0
    ? attraction.accessibility.map((a) => a.replace(/-/g, ' ')).join(', ')
    : 'standard accessibility'

  // Build nearby events for pairing
  const eventPairings = nearbyEvents.length > 0
    ? nearbyEvents
        .slice(0, 5)
        .map((e) => {
          const price = e.is_free ? 'Free' : e.price_min != null ? `From $${e.price_min}` : 'Varies'
          const venue = e.venue_name || e.neighborhood || 'nearby'
          return `- ${e.title} at ${venue} (${price})`
        })
        .join('\n')
    : ''

  // Price info
  const priceInfo = attraction.price_type === 'free'
    ? 'Free admission'
    : attraction.price_type === 'donation'
    ? 'Suggested donation'
    : attraction.price_range
    ? `${attraction.price_range}`
    : 'Paid admission'

  // Duration info
  const durationInfo = attraction.duration_minutes
    ? `${Math.floor(attraction.duration_minutes / 60)} hours ${attraction.duration_minutes % 60 > 0 ? `${attraction.duration_minutes % 60} minutes` : ''}`
    : '2-3 hours'

  const system = `You are an expert Houston local guide writer for ExploreHTX.
You write engaging, detailed attraction spotlights that help readers discover Houston's best museums, parks, and experiences.
Your tone is enthusiastic, knowledgeable, and practical — like a trusted local friend showing someone their favorite spot.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) using this exact schema:
{
  "title": "string — the post headline",
  "excerpt": "string — 150–160 character meta description / post summary",
  "content": "string — full markdown post body",
  "keywords": ["array", "of", "seo", "keywords"],
  "tags": ["array", "of", "short", "topic", "tags"]
}`

  const user = `Write an attraction spotlight blog post for "${attraction.name}" for ExploreHTX.

ATTRACTION DETAILS:
- Name: ${attraction.name}
- Category: ${category?.name ?? 'Houston Attraction'}
- Neighborhood: ${attraction.neighborhood ?? 'Houston'}
- Price: ${priceInfo}${attraction.price_notes ? ` (${attraction.price_notes})` : ''}
- Typical Visit: ${durationInfo}
- Best For: ${bestForText}
- Features: ${featuresText}
- Accessibility: ${accessibilityText}
- Tags: ${attraction.tags.join(', ')}
- Description: ${attraction.description ?? attraction.short_description ?? 'A must-visit Houston attraction'}
${attraction.seasonal_notes ? `- Seasonal Notes: ${attraction.seasonal_notes}` : ''}
${eventPairings ? `\nNEARBY EVENTS to pair with your visit:\n${eventPairings}` : ''}

Requirements:
- Title: Engaging headline featuring the attraction name (e.g., "${attraction.name}: ${category?.name ?? 'Houston\'s Hidden Gem'}" or "Why ${attraction.name} Should Be on Your Houston Bucket List")
- Length: 800–1200 words
- Format:
  1. **Opening Hook** (2-3 sentences): What makes this place special, why it matters to Houston
  2. **"What to Expect"** section: Detailed description of the experience, what visitors will see/do
  3. **"Highlights You Can't Miss"** section: 3-5 specific things to see, exhibits, trails, or features
  4. **"Pro Tips for Visiting"** section:
     - Best time to visit (avoid crowds, weather, lighting)
     - How long to plan for your visit
     - Parking and transportation tips
     - What to bring or wear
     - ${attraction.price_type === 'paid' ? 'Money-saving tips (free days, discounts)' : 'How to make the most of this free attraction'}
  5. ${nearbyEvents.length > 0 ? '**"Pair It With"** section: Suggest combining with a nearby event or activity' : '**"Nearby"** section: What else to do in the area'}
  6. **"Who Should Visit"** section: Which types of visitors will enjoy this most
  7. **Closing**: Encourage readers to explore, with CTA to check /things-to-do for more attractions

- Internal links:
  - Link attraction name to /things-to-do/${attraction.slug}
  ${category ? `- Link to /things-to-do/category/${category.slug} for more ${category.name.toLowerCase()}` : ''}
  - Link to /things-to-do for all Houston attractions
  - Link to /events for the events calendar

- Tone: Enthusiastic and informative — like a local sharing their favorite spot
- Include a mix of practical info and storytelling
- Include 6-10 SEO keywords related to: ${attraction.name}, Houston ${category?.name?.toLowerCase() ?? 'attractions'}, things to do in Houston, ${attraction.neighborhood ?? 'Houston'} activities
- Include 5-7 tags`

  return { system, user }
}
