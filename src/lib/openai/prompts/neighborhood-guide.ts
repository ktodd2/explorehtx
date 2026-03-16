import type { Event } from '../../../types/database'

interface NeighborhoodGuidePromptParams {
  neighborhood: string   // e.g. "Montrose"
  areaDescription: string // e.g. "Houston's artsy, eclectic heart"
  events: Event[]
}

interface PromptMessages {
  system: string
  user: string
}

/**
 * Build the system + user prompt for a Houston Neighborhood Spotlight post.
 * Target: 900–1300 words, markdown, local flavor, evergreen + timely blend.
 */
export function buildNeighborhoodGuidePrompt(
  params: NeighborhoodGuidePromptParams
): PromptMessages {
  const { neighborhood, areaDescription, events } = params

  const eventSummaries = events
    .slice(0, 15)
    .map((e) => {
      const price = e.is_free ? 'Free' : e.price_min != null ? `From $${e.price_min}` : 'Varies'
      const venue = e.venue_name ? ` at ${e.venue_name}` : ''
      const date = new Date(e.start_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Chicago',
      })
      return `- ${e.title}${venue} | ${date} | ${price} | ${e.category}`
    })
    .join('\n')

  const hasEvents = events.length > 0

  const system = `You are a knowledgeable Houston local writing neighborhood guides for ExploreHTX.
Your tone is authoritative yet approachable — you genuinely love Houston and know its neighborhoods intimately.
You write content that is both SEO-optimized and genuinely useful for residents and visitors alike.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) using this exact schema:
{
  "title": "string — the post headline",
  "excerpt": "string — 150–160 character meta description / post summary",
  "content": "string — full markdown post body",
  "keywords": ["array", "of", "seo", "keywords"],
  "tags": ["array", "of", "short", "topic", "tags"]
}`

  const user = `Write a neighborhood spotlight guide for ${neighborhood}, ${areaDescription}, in Houston, Texas.

${hasEvents ? `Upcoming events in ${neighborhood}:\n${eventSummaries}\n` : ''}
Requirements:
- Title: "Exploring ${neighborhood}: What to Do in Houston's ${areaDescription}" (or a compelling variation)
- Length: 900–1300 words
- Format: Markdown with ## H2 subheadings such as:
  ## About ${neighborhood}
  ## Best Things to Do
  ## Dining & Nightlife
  ## Upcoming Events
  ## Getting There
- Tone: Knowledgeable local guide — informative, warm, with specific details (street names, local institutions, hidden gems)
- Mix evergreen neighborhood info (what makes it unique, best spots) with the specific upcoming events
- Include 1–2 "local's tip" callouts using > blockquote markdown
- Use descriptive language that paints a picture of the neighborhood's vibe and character
- End with a "## Explore More Houston Neighborhoods" CTA linking readers back to the blog
- Include 5–8 SEO keywords targeting "things to do in ${neighborhood}", "Houston neighborhoods", "${neighborhood} Houston guide"
- Include 4–6 tags`

  return { system, user }
}

/**
 * Houston neighborhoods paired with descriptive area labels for rotating content.
 */
export const HOUSTON_NEIGHBORHOODS: Array<{ name: string; description: string }> = [
  { name: 'Montrose', description: "artsy, eclectic heart" },
  { name: 'The Heights', description: "historic bungalow district" },
  { name: 'Midtown', description: "urban nightlife hub" },
  { name: 'EaDo', description: "East Downtown arts corridor" },
  { name: 'Museum District', description: "cultural epicenter" },
  { name: 'Greenway Plaza', description: "uptown business and dining corridor" },
  { name: 'Rice Village', description: "boutique shopping and dining enclave" },
  { name: 'Washington Avenue', description: "bar and entertainment strip" },
  { name: 'Sugar Land', description: "thriving suburban gem" },
  { name: 'Katy', description: "fast-growing western suburb" },
  { name: 'Spring Branch', description: "diverse culinary destination" },
  { name: 'Pearland', description: "southern suburb with big city energy" },
]
