// =============================================================================
// ExploreHTX — GET /api/subscribe/unsubscribe?token=<token>
// Unsubscribes a subscriber using their unsubscribe token.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://explorehtx.us.com'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/unsubscribe?error=missing_token`
    )
  }

  const supabase = createAdminClient()

  // Look up subscriber by unsubscribe token
  const { data: subscriber, error: lookupError } = await supabase
    .from('subscribers')
    .select('id, status')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  if (lookupError) {
    console.error('[unsubscribe] Supabase lookup error:', lookupError.message)
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/unsubscribe?error=server_error`
    )
  }

  if (!subscriber) {
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/unsubscribe?error=invalid_token`
    )
  }

  if (subscriber.status === 'unsubscribed') {
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/unsubscribe?success=already_unsubscribed`
    )
  }

  // Update subscriber status
  const { error: updateError } = await supabase
    .from('subscribers')
    .update({
      status: 'unsubscribed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id)

  if (updateError) {
    console.error('[unsubscribe] Supabase update error:', updateError.message)
    return NextResponse.redirect(
      `${BASE_URL}/subscribe/unsubscribe?error=server_error`
    )
  }

  return NextResponse.redirect(
    `${BASE_URL}/subscribe/unsubscribe?success=true`
  )
}
