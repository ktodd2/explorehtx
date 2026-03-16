// =============================================================================
// ExploreHTX — Send welcome email
// =============================================================================

import { render } from '@react-email/components'
import WelcomeEmail from './templates/WelcomeEmail'
import { sendEmail } from './resend'
import type { SendEmailResult } from './resend'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://explorehtx.us.com'

export interface SendWelcomeOptions {
  email: string
  subscriberName?: string | null
}

/**
 * Render the WelcomeEmail template and send it via Resend.
 */
export async function sendWelcomeEmail(
  options: SendWelcomeOptions
): Promise<SendEmailResult> {
  const preferencesUrl = `${BASE_URL}/subscribe`
  const eventsUrl = `${BASE_URL}/events`

  const html = await render(
    WelcomeEmail({
      subscriberName: options.subscriberName,
      preferencesUrl,
      eventsUrl,
    })
  )

  return sendEmail({
    to: options.email,
    subject: 'Welcome to ExploreHTX — Houston events, delivered weekly',
    html,
  })
}
