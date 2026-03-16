// =============================================================================
// ExploreHTX — Resend client and send helper
// =============================================================================

import { Resend } from 'resend'
import type { ReactNode } from 'react'

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[Resend] RESEND_API_KEY not set — email sending is disabled');
    return null;
  }
  return new Resend(key);
}

export const resend = getResendClient();

export const DEFAULT_FROM = 'ExploreHTX <hello@explorehtx.us.com>'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  react?: ReactNode
  text?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string | string[]
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send an email via Resend with standardized error handling.
 * Defaults the `from` address to the ExploreHTX sender.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const { from = DEFAULT_FROM, to, subject, html, react, text, cc, bcc, replyTo } = options

  if (!resend) {
    console.warn('[Resend] Email not sent (no API key):', subject);
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    // Build a payload typed as the html/react/text variant of CreateEmailOptions
    const payload = {
      from,
      to,
      subject,
      ...(html !== undefined && { html }),
      ...(react !== undefined && { react }),
      ...(text !== undefined && { text }),
      ...(cc !== undefined && { cc }),
      ...(bcc !== undefined && { bcc }),
      ...(replyTo !== undefined && { replyTo }),
    } as const

    const response = await resend.emails.send(
      // Cast through unknown to sidestep the discriminated union narrowing —
      // Resend's runtime handles all three content variants identically.
      payload as Parameters<typeof resend.emails.send>[0]
    )

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      }
    }

    return {
      success: true,
      id: response.data?.id,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: message,
    }
  }
}
