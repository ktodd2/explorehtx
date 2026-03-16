// =============================================================================
// ExploreHTX — Send verification email
// =============================================================================

import { randomUUID } from 'crypto'
import { render } from '@react-email/components'
import VerificationEmail from './templates/VerificationEmail'
import { sendEmail } from './resend'
import type { SendEmailResult } from './resend'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://explorehtx.us.com'

export interface SendVerificationOptions {
  email: string
  subscriberName?: string | null
  token?: string
}

export interface SendVerificationResult extends SendEmailResult {
  token: string
}

/**
 * Generate a verification token, build the verification URL, render the
 * VerificationEmail template, and send it via Resend.
 *
 * Returns the token so it can be persisted to the database.
 */
export async function sendVerificationEmail(
  options: SendVerificationOptions
): Promise<SendVerificationResult> {
  const token = options.token ?? randomUUID()
  const verificationUrl = `${BASE_URL}/api/subscribe/verify?token=${token}`

  const html = await render(
    VerificationEmail({
      verificationUrl,
      subscriberName: options.subscriberName,
    })
  )

  const result = await sendEmail({
    to: options.email,
    subject: 'Verify your ExploreHTX subscription',
    html,
  })

  return { ...result, token }
}
