// =============================================================================
// ExploreHTX — /subscribe/verify
// Verification landing page — displays success or error state.
// =============================================================================

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Email Verified | ExploreHTX',
  robots: { index: false },
}

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { success, error } = params

  const isSuccess = success === 'true' || success === 'already_verified'
  const alreadyVerified = success === 'already_verified'

  return (
    <div className="min-h-screen bg-space-blue-900 flex items-center justify-center px-4 py-20">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-10 text-center">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-space-blue-900 mb-3">
              {alreadyVerified ? 'Already verified!' : "You're verified!"}
            </h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              {alreadyVerified
                ? 'Your email address is already confirmed. You\u2019ll keep receiving your weekly Houston event digest.'
                : 'Your email address is confirmed. Welcome to ExploreHTX! Check your inbox for a welcome email with everything you need to get started.'}
            </p>
            <Link
              href="/events"
              className="inline-block rounded-xl bg-sunset-orange-500 px-6 py-3 text-white font-bold hover:bg-sunset-orange-600 transition shadow-lg shadow-sunset-orange-500/25"
            >
              Browse Houston Events
            </Link>
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
              Verification failed
            </h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              {error === 'invalid_token'
                ? 'This verification link is invalid or has expired. Verification links expire after 24 hours.'
                : error === 'missing_token'
                ? 'No verification token was provided. Please use the link from your confirmation email.'
                : 'Something went wrong on our end. Please try again.'}
            </p>
            <Link
              href="/subscribe"
              className="inline-block rounded-xl bg-space-blue-900 px-6 py-3 text-white font-bold hover:bg-space-blue-800 transition"
            >
              Try Subscribing Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
