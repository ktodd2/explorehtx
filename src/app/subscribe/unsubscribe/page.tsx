// =============================================================================
// ExploreHTX — /subscribe/unsubscribe
// Unsubscribe landing page — displays success or error state.
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unsubscribe | ExploreHTX',
  robots: { index: false },
}

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const params = await searchParams
  const { success, error } = params

  const isSuccess =
    success === 'true' || success === 'already_unsubscribed'
  const alreadyUnsubscribed = success === 'already_unsubscribed'

  return (
    <div className="min-h-screen bg-space-blue-900 flex items-center justify-center px-4 py-20">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-10 text-center">
        {isSuccess ? (
          <>
            <div className="text-5xl mb-5">&#128075;</div>
            <h1 className="text-2xl font-bold text-space-blue-900 mb-3">
              {alreadyUnsubscribed
                ? 'Already unsubscribed'
                : "We're sorry to see you go"}
            </h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              {alreadyUnsubscribed
                ? "You've already been removed from our list. You won't receive any further emails from ExploreHTX."
                : "You've been successfully unsubscribed from ExploreHTX emails. You won't receive any more messages from us."}
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Changed your mind? You can always re-subscribe below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/subscribe"
                className="inline-block rounded-xl bg-sunset-orange-500 px-6 py-3 text-white font-bold hover:bg-sunset-orange-600 transition shadow-lg shadow-sunset-orange-500/25 text-sm"
              >
                Re-subscribe
              </Link>
              <Link
                href="/events"
                className="inline-block rounded-xl bg-gray-100 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 transition text-sm"
              >
                Browse Events
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-space-blue-900 mb-3">
              Unsubscribe failed
            </h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              {error === 'invalid_token'
                ? 'This unsubscribe link is invalid or has expired. Please use the link from your most recent email.'
                : error === 'missing_token'
                ? 'No unsubscribe token was provided. Please use the link from one of your emails.'
                : 'Something went wrong on our end. Please try again.'}
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-space-blue-900 px-6 py-3 text-white font-bold hover:bg-space-blue-800 transition text-sm"
            >
              Go to Homepage
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
