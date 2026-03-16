import OpenAI from 'openai'

/**
 * Shared OpenAI client instance.
 * Initialized lazily — safe to import in cron and server-side code.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
