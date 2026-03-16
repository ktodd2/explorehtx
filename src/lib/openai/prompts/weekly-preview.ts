import type { Event } from '../../../types/database'

interface WeeklyPreviewPromptParams {
  events: Event[]
  dateRangeLabel: string // e.g. "March 17–23, 2025"
  isMonthly?: boolean    // true when covering a full month
  monthLabel?: string    // e.g. "March 2025" (used when isMonthly is true)
}

interface PromptMessages {
  system: string
  user: string
}

/**
 * Build the system + user prompt for a Houston Weekly (or Monthly) Preview post.
 * Target: 800–1200 words, markdown, H2 subheadings, local insider tone.
 */
export function buildWeeklyPreviewPrompt(
  params: WeeklyPreviewPromptParams
): PromptMessages {
  const { events, dateRangeLabel, isMonthly = false, monthLabel } = params

  const eventSummaries = events
    .slice(0, 25)
    .map((e) => {
      const price = e.is_free ? 'Free' : e.price_min != null ? `From $${e.price_min}` : 'Varies'
      const venue = e.venue_name ? ` at ${e.venue_name}` : ''
      const neighborhood = e.neighborhood ? ` (${e.neighborhood})` : ''
      const date = new Date(e.start_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Chicago',
      })
      return `- ${e.title}${venue}${neighborhood} | ${date} | ${price} | ${e.category}`
    })
    .join('\n')

  const scope = isMonthly
    ? `the month of ${monthLabel ?? dateRangeLabel}`
    : `the week of ${dateRangeLabel}`

  const titleTemplate = isMonthly
    ? `Best Things to Do in Houston in ${monthLabel ?? dateRangeLabel}`
    : `Things to Do This Week in Houston: ${dateRangeLabel}`

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

  const user = `Write a Houston ${isMonthly ? 'monthly roundup' : 'weekly preview'} blog post covering ${scope}.

Here are the events coming up:
${eventSummaries}

Requirements:
- Title: "${titleTemplate}" (or a more compelling variation)
- Length: 800–1200 words
- Format: Markdown with ## H2 subheadings organized by category or day (e.g. ## Monday–Wednesday Picks, ## The Weekend Ahead, ## Family-Friendly Options)
- Tone: Helpful Houston local — reference neighborhoods like Midtown, Montrose, The Heights, EaDo, Museum District, River Oaks
- Weave events naturally into narrative paragraphs; don't just list them
- Include a "## Editor's Top Picks" section with 2–3 standout recommendations and why they're worth attending
- Highlight any free events as a budget-friendly angle
- End with a "## Never Miss a Houston Event" CTA encouraging readers to subscribe to ExploreHTX
- Include 5–8 relevant SEO keywords (e.g. "Houston events this week", "things to do in Houston")
- Include 4–6 short tags`

  return { system, user }
}
