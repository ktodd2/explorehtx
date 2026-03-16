import { createHash } from 'crypto'
import { marked } from 'marked'
import { openai } from './client'
import type { InsertBlogPost, BlogPostType } from '../../types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptMessages {
  system: string
  user: string
}

interface OpenAIPostResponse {
  title: string
  excerpt: string
  content: string
  keywords: string[]
  tags: string[]
}

interface GeneratePostOptions {
  postType: BlogPostType
  prompts: PromptMessages
  relatedEventIds?: string[]
  category?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive a URL-safe slug from a title + current date.
 * e.g. "Houston Weekend Guide: March 21-23" → "houston-weekend-guide-march-21-23-20250321"
 */
function slugifyTitle(title: string, date: Date = new Date()): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
  return `${base}-${dateStr}`
}

/**
 * Compute a SHA-256 hash of the prompt pair for duplicate detection.
 */
function hashPrompt(system: string, user: string): string {
  return createHash('sha256').update(`${system}\n---\n${user}`).digest('hex')
}

/**
 * Count words in a markdown string (rough but consistent).
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Compute reading time in minutes, rounding up.
 * Average reading speed: 200 wpm.
 */
function readingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------

/**
 * Call GPT-4o-mini with a structured prompt, parse the JSON response,
 * convert markdown to HTML, and return an InsertBlogPost ready for Supabase.
 */
export async function generateBlogPost(
  options: GeneratePostOptions
): Promise<InsertBlogPost> {
  const { postType, prompts, relatedEventIds = [], category } = options

  const promptHash = hashPrompt(prompts.system, prompts.user)

  // ── 1. Call OpenAI ──────────────────────────────────────────────────────
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompts.system },
      { role: 'user', content: prompts.user },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  })

  const rawContent = completion.choices[0]?.message?.content
  if (!rawContent) {
    throw new Error('OpenAI returned an empty response')
  }

  // ── 2. Parse structured response ────────────────────────────────────────
  let parsed: OpenAIPostResponse
  try {
    parsed = JSON.parse(rawContent) as OpenAIPostResponse
  } catch (err) {
    throw new Error(`Failed to parse OpenAI JSON response: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Basic validation
  if (!parsed.title || !parsed.content) {
    throw new Error('OpenAI response missing required fields: title or content')
  }

  const title = parsed.title.trim()
  const markdownContent = parsed.content.trim()
  const excerpt = parsed.excerpt?.trim() ?? ''
  const keywords: string[] = Array.isArray(parsed.keywords) ? parsed.keywords : []
  const tags: string[] = Array.isArray(parsed.tags) ? parsed.tags : []

  // ── 3. Convert markdown → HTML ──────────────────────────────────────────
  const contentHtml = await Promise.resolve(marked(markdownContent))

  // ── 4. Compute word count + reading time ────────────────────────────────
  const wordCount = countWords(markdownContent)
  const readingTimeMinutes = readingTime(wordCount)

  // ── 5. Build slug ────────────────────────────────────────────────────────
  const slug = slugifyTitle(title)

  // ── 6. Build InsertBlogPost ──────────────────────────────────────────────
  const now = new Date().toISOString()

  const post: InsertBlogPost = {
    slug,
    title,
    excerpt: excerpt || null,
    content: markdownContent,
    content_html: contentHtml,
    cover_image_url: null,
    cover_image_alt: null,
    author: 'ExploreHTX',
    post_type: postType,
    category: category ?? null,
    tags,
    meta_title: title,
    meta_description: excerpt || null,
    keywords,
    related_event_ids: relatedEventIds,
    status: 'published',
    published_at: now,
    ai_generated: true,
    ai_model: 'gpt-4o-mini',
    ai_prompt_hash: promptHash,
    word_count: wordCount,
    reading_time_minutes: readingTimeMinutes,
  }

  return post
}
