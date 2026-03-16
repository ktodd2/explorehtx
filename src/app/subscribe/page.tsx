import type { Metadata } from 'next';
import SubscribeForm from '@/components/subscribe/SubscribeForm';

export const metadata: Metadata = {
  title: 'Subscribe to Houston Events',
  description:
    'Get a weekly digest of the best Houston events, concerts, food, and things to do — delivered straight to your inbox.',
  alternates: {
    canonical: 'https://explorehtx.us.com/subscribe',
  },
};

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-space-blue-900">
      <section className="py-16 px-4 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
          Never miss a Houston event
        </h1>
        <p className="text-space-blue-200 text-lg max-w-xl mx-auto leading-relaxed">
          Get a curated weekly digest of the best things to do in the Bayou City
          — concerts, festivals, food events, and more.
        </p>
      </section>

      <SubscribeForm />
    </div>
  );
}
