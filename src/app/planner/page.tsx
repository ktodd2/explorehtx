import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Calendar, Sparkles } from 'lucide-react';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import PlannerClient from './PlannerClient';

export const metadata: Metadata = {
  title: 'Weekend Planner | Plan Your Houston Adventure',
  description:
    'Plan your perfect Houston weekend. Add events, restaurants, and attractions to build your itinerary. Share your plans with friends.',
  alternates: {
    canonical: 'https://explorehtx.us.com/planner',
  },
  openGraph: {
    title: 'Weekend Planner | ExploreHTX',
    description: 'Plan your perfect Houston weekend with our itinerary builder.',
    url: 'https://explorehtx.us.com/planner',
    type: 'website',
  },
};

export default function PlannerPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'Weekend Planner', href: '/planner' },
        ]}
      />

      {/* Header */}
      <section className="bg-gradient-to-br from-space-blue-800 to-space-blue-950 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Weekend Planner</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sunset-orange-400 to-sunset-orange-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                Weekend Planner
              </h1>
              <p className="text-space-blue-200 flex items-center gap-1.5 mt-1">
                <Sparkles className="w-4 h-4" />
                Build your perfect Houston weekend
              </p>
            </div>
          </div>

          <p className="text-space-blue-200 text-lg leading-relaxed max-w-2xl">
            Drag and drop events, restaurants, and attractions to create your
            itinerary. Your plan is saved automatically.
          </p>
        </div>
      </section>

      {/* Planner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlannerClient />
      </div>
    </>
  );
}
