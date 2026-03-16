import type { Event } from '../../../types/database'

interface WeekendRoundupPromptParams {
  events: Event[]
  dateRangeLabel: string // e.g. "March 21–23, 2025"
}

interface PromptMessages {
  system: string
  user: string
}

/**
 * Build the system + user prompt for a Houston Weekend Roundup post.
 * Target: 800–1200 words, markdown, H2 subheadings, local insider tone.
 */
export function buildWeekendRoundupPrompt(
  params: WeekendRoundupPromptParams
): PromptMessages {
  const { events, dateRangeLabel } = params

  const eventSummaries = events
    .slice(0, 20)
    .map((e) => {
      const price = e.is_free ? 'Free' : e.price_min != null ? `From $${e.price_min}` : 'Varies'
      const venue = e.venue_name ? ` at ${e.venue_name}` : ''
      const neighborhood = e.neighborhood ? ` (${e.neighborhood})` : ''
      return `- ${e.title}${venue}${neighborhood} | ${price} | Category: ${e.category}`
    })
    .join('\n')

  const system = `You are an enthusiastic local Houston insider writing for ExploreHTX, a city guide for Houston, Texas.
Your writing is warm, conversational, and genuinely helpful — like advice from a well-connected friend who lives in Houston.
You write engaging, SEO-friendly content that feels authentic rather than robotic.
Always focus on what makes Houston special: its diverse neighborhoods, vibrant culture, and unique character.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) using this exact schema:
{
  "title": "string — the post headline",
  "excerpt": "string — 150–160 character meta description / post summary",
  "content": "string — full markdown post body",
  "keywords": ["array", "of", "seo", "keywords"],
  "tags": ["array", "of", "short", "topic", "tags"]
}`

  const user = `Write a Houston Weekend Guide blog post covering the weekend of ${dateRangeLabel}.

Here are the events happening this weekend:
${eventSummaries}

Requirements:
- Title: "Houston Weekend Guide: ${dateRangeLabel}" (or a more compelling variation)
- Length: 800–1200 words
- Format: Markdown with ## H2 subheadings (e.g. ## Music & Nightlife, ## Family Fun, ## Food & Festivals)
- Tone: Enthusiastic Houston local — use phrases like "y'all", "the Bayou City", "HTX", neighborhood names
- Weave events naturally into the prose; don't just list them
- Include a "## Don't Miss This Weekend" section highlighting 1–2 standout picks
- Mention specific Houston neighborhoods where relevant (Midtown, Montrose, The Heights, EaDo, Museum District, etc.)
- End with a "## Stay in the Loop" CTA encouraging readers to subscribe to ExploreHTX for weekly updates
- Include 5–8 relevant SEO keywords (e.g. "Houston weekend events", "things to do in Houston this weekend")
- Include 4–6 short tags (e.g. "weekend", "events", "houston", "guide")`

  return { system, user }
}
