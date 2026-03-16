// =============================================================================
// ExploreHTX — GET /api/subscribe/verify?token=<token>
// Verifies a subscriber's email and sends the welcome email.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://explorehtx.us.com'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/verify?error=missing_token`
    )
  }

  const supabase = createAdminClient()

  // Look up subscriber by verification token
  const { data: subscriber, error: lookupError } = await supabase
    .from('subscribers')
    .select('id, email, name, is_verified')
    .eq('verification_token', token)
    .maybeSingle()

  if (lookupError) {
    console.error('[verify] Supabase lookup error:', lookupError.message)
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/verify?error=server_error`
    )
  }

  if (!subscriber) {
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/verify?error=invalid_token`
    )
  }

  if (subscriber.is_verified) {
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/verify?success=already_verified`
    )
  }

  // Mark as verified and clear the token
  const { error: updateError } = await supabase
    .from('subscribers')
    .update({
      is_verified: true,
      verification_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id)

  if (updateError) {
    console.error('[verify] Supabase update error:', updateError.message)
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/verify?error=server_error`
    )
  }

  // Log to email_logs
  await supabase.from('email_logs').insert({
    subscriber_id: subscriber.id,
    email_type: 'verification',
    subject: 'Verify your ExploreHTX subscription',
    status: 'delivered',
    sent_at: new Date().toISOString(),
  })

  // Send welcome email (non-blocking — don't fail the redirect if it errors)
  sendWelcomeEmail({
    email: subscriber.email,
    subscriberName: subscriber.name,
  }).catch((err) => {
    console.error('[verify] Failed to send welcome email:', err)
  })

  return NextResponse.redirect(
    `${BASE_URL}/subscribe/verify?success=true`
  )
}
