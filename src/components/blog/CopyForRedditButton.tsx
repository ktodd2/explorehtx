'use client'

import { useState } from 'react'
import { MessageSquare, Check } from 'lucide-react'

interface CopyForRedditButtonProps {
  title: string
  excerpt: string | null
  url: string
  headings: string[]
}

/**
 * Format blog post content for Reddit and copy to clipboard.
 * Creates a clean, Reddit-friendly format with title, highlights, and link.
 */
export default function CopyForRedditButton({
  title,
  excerpt,
  url,
  headings,
}: CopyForRedditButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    // Build Reddit-formatted text
    const lines: string[] = []

    // Title
    lines.push(`**${title}**`)
    lines.push('')

    // Excerpt if available
    if (excerpt) {
      lines.push(excerpt)
      lines.push('')
    }

    // Key sections as bullet points (max 5)
    if (headings.length > 0) {
      lines.push("What's covered:")
      headings.slice(0, 5).forEach((heading) => {
        lines.push(`• ${heading}`)
      })
      lines.push('')
    }

    // Link
    lines.push(`Full guide: ${url}`)
    lines.push('')
    lines.push('---')
    lines.push('*From ExploreHTX - Houston events & local guides*')

    const redditText = lines.join('\n')

    try {
      await navigator.clipboard.writeText(redditText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4500] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
      aria-label="Copy formatted text for Reddit"
      type="button"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <MessageSquare className="w-4 h-4" />
          Copy for Reddit
        </>
      )}
    </button>
  )
}
