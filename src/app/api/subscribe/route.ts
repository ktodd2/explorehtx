// =============================================================================
// ExploreHTX — POST /api/subscribe
// Creates a new subscriber record and sends a verification email.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVerificationEmail } from '@/lib/email/send-verification'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    )
  }

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const name =
    typeof body.name === 'string' ? body.name.trim() : null
  const categories = Array.isArray(body.categories)
    ? (body.categories as unknown[]).filter((c) => typeof c === 'string') as string[]
    : []
  const neighborhoods = Array.isArray(body.neighborhoods)
    ? (body.neighborhoods as unknown[]).filter((n) => typeof n === 'string') as string[]
    : []

  // Validate email
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'A valid email address is required.' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Check if already subscribed
  const { data: existing, error: lookupError } = await supabase
    .from('subscribers')
    .select('id, status, is_verified')
    .eq('email', email)
    .maybeSingle()

  if (lookupError) {
    console.error('[subscribe] Supabase lookup error:', lookupError.message)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }

  if (existing) {
    if (existing.status === 'active' && existing.is_verified) {
      return NextResponse.json(
        { error: 'This email is already subscribed.' },
        { status: 409 }
      )
    }

    // Re-send verification for unverified or previously unsubscribed
    const { success, token, error: sendError } = await sendVerificationEmail({
      email,
      subscriberName: name,
    })

    if (!success) {
      console.error('[subscribe] Resend error:', sendError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    await supabase
      .from('subscribers')
      .update({
        name,
        categories,
        neighborhoods,
        status: 'active',
        is_verified: false,
        verification_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    return NextResponse.json({ message: 'Verification email resent.' })
  }

  // Generate tokens and send verification email first so we have the token
  const { success, token, error: sendError } = await sendVerificationEmail({
    email,
    subscriberName: name,
  })

  if (!success) {
    console.error('[subscribe] Resend error:', sendError)
    return NextResponse.json(
      { error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    )
  }

  // Insert new subscriber
  const { error: insertError } = await supabase.from('subscribers').insert({
    email,
    name,
    categories,
    neighborhoods,
    frequency: 'weekly',
    is_verified: false,
    verification_token: token,
    status: 'active',
  })

  if (insertError) {
    console.error('[subscribe] Supabase insert error:', insertError.message)
    return NextResponse.json(
      { error: 'Failed to create subscription. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { message: 'Check your email to verify your subscription.' },
    { status: 201 }
  )
}
