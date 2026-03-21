import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventSubmissionForm from './EventSubmissionForm';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Submit an Event | ExploreHTX',
  description:
    'Share your Houston event with the community. Submit concerts, festivals, food events, and more to be featured on ExploreHTX.',
  alternates: {
    canonical: 'https://explorehtx.us.com/submit-event',
  },
  openGraph: {
    title: 'Submit an Event | ExploreHTX',
    description:
      'Share your Houston event with the community. Submit concerts, festivals, food events, and more.',
    url: 'https://explorehtx.us.com/submit-event',
    type: 'website',
  },
};

async function fetchCategories(): Promise<{ slug: string; name: string }[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('slug, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return data ?? [];
}

export default async function SubmitEventPage() {
  const categories = await fetchCategories();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Submit Event', href: '/submit-event' },
        ]}
      />

      {/* Header */}
      <section className="bg-gradient-to-br from-space-blue-800 to-space-blue-950 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Submit Event</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-sunset-orange-500 flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
              Submit an Event
            </h1>
          </div>

          <p className="text-space-blue-200 text-lg leading-relaxed max-w-xl">
            Share your Houston event with our community. All submissions are
            reviewed before publishing.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <EventSubmissionForm categories={categories} />

        {/* Guidelines */}
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
          <h2 className="font-semibold text-gray-900 mb-3">Submission Guidelines</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-sunset-orange-500 font-bold">•</span>
              Events must be in the Houston metropolitan area
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sunset-orange-500 font-bold">•</span>
              Include accurate date, time, and location information
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sunset-orange-500 font-bold">•</span>
              Provide a clear description of what attendees can expect
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sunset-orange-500 font-bold">•</span>
              Use a high-quality image (recommended: 1200x630px)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sunset-orange-500 font-bold">•</span>
              Reviews typically take 1-2 business days
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
