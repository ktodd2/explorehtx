import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Zap,
  Brain,
  Calendar,
  Mail,
  ArrowRight,
  Globe,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About ExploreHTX | Your Houston Events Guide',
  description:
    'ExploreHTX is your locally focused guide to Houston events, neighborhoods, and things to do. Auto-aggregated events and AI-curated content — updated daily.',
  alternates: {
    canonical: 'https://explorehtx.us.com/about',
  },
};

const HOW_IT_WORKS = [
  {
    icon: Globe,
    title: 'Auto-aggregated events',
    description:
      'We pull events from dozens of Houston sources — Eventbrite, local venues, ticketing platforms, and more — so you get one comprehensive view of what\'s happening.',
  },
  {
    icon: Brain,
    title: 'AI-curated content',
    description:
      'Our AI reads the event data, identifies trends, and writes neighborhood guides, weekend roundups, and curated lists tailored to what Houstonians actually care about.',
  },
  {
    icon: Zap,
    title: 'Updated daily',
    description:
      'New events are ingested every night. Cancelled or rescheduled events are removed automatically so you\'re never chasing ghost shows.',
  },
  {
    icon: Mail,
    title: 'Weekly email digest',
    description:
      'Subscribe and get the best upcoming events delivered to your inbox every Friday — organized by category, neighborhood, or whatever you care about most.',
  },
];

const NEIGHBORHOODS = [
  { name: 'Midtown', slug: 'midtown', tagline: 'Bars, brunch, and nightlife' },
  { name: 'Montrose', slug: 'montrose', tagline: 'Art, culture, and eclectic dining' },
  { name: 'The Heights', slug: 'the-heights', tagline: 'Boutiques, breweries, and bungalows' },
  { name: 'Downtown', slug: 'downtown', tagline: 'Sports, concerts, and corporate Houston' },
  { name: 'EaDo', slug: 'eado', tagline: 'East Downtown\'s rising arts scene' },
  { name: 'River Oaks', slug: 'river-oaks', tagline: 'Upscale dining and refined culture' },
  { name: 'Museum District', slug: 'museum-district', tagline: 'World-class museums and Hermann Park' },
  { name: 'Washington Ave', slug: 'washington-ave', tagline: 'Nightlife corridor and craft cocktails' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative bg-space-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-space-blue-900 via-space-blue-800 to-space-blue-700 opacity-90" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-sunset-orange-500/20 text-sunset-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            Made for Houstonians, by Houstonians
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            About{' '}
            <span className="text-sunset-orange-400">ExploreHTX</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-space-blue-200 max-w-2xl mx-auto leading-relaxed">
            Houston is one of the most dynamic cities in the country — 4th largest,
            the most diverse, and consistently underrated. ExploreHTX exists to
            change that.
          </p>
        </div>
      </section>

      {/* Mission ─────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="prose prose-lg max-w-none">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-6">
            Our Mission
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg mb-4">
            Houston has world-class food scenes, legendary live music, incredible
            museums, diverse neighborhoods, and some of the best sports franchises
            in the country. Yet too many Houstonians — and visitors — only scratch
            the surface.
          </p>
          <p className="text-gray-600 leading-relaxed text-lg mb-4">
            ExploreHTX is your always-up-to-date guide to everything the Bayou City
            has to offer. Whether you&rsquo;re a lifelong resident looking for something
            new, a transplant still learning the city&rsquo;s rhythm, or a visitor with
            a weekend to explore — we&rsquo;ve got you covered.
          </p>
          <p className="text-gray-600 leading-relaxed text-lg">
            We aggregate events from across the city, write neighborhood guides,
            curate free-things-to-do lists, and deliver it all straight to your
            inbox. No noise — just the good stuff.
          </p>
        </div>
      </section>

      {/* How it Works ────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              How ExploreHTX Works
            </h2>
            <p className="mt-3 text-gray-600 text-lg max-w-xl mx-auto">
              Technology that keeps your social calendar full without the legwork.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-sunset-orange-100 text-sunset-orange-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Neighborhoods ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Houston&rsquo;s Neighborhoods
            </h2>
            <p className="mt-2 text-gray-600">
              Every Houston neighborhood has its own personality. Explore them all.
            </p>
          </div>
          <Link
            href="/neighborhoods"
            className="hidden sm:inline-flex items-center gap-2 text-sunset-orange-600 hover:text-sunset-orange-700 font-medium transition-colors"
          >
            All Neighborhoods
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {NEIGHBORHOODS.map((n) => (
            <Link
              key={n.slug}
              href={`/neighborhoods/${n.slug}`}
              className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-space-blue-100 text-space-blue-600 flex items-center justify-center mb-3 group-hover:bg-space-blue-600 group-hover:text-white transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {n.name}
              </h3>
              <p className="text-xs text-gray-500 leading-snug">{n.tagline}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/neighborhoods"
            className="inline-flex items-center gap-2 text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
          >
            All Neighborhoods
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Stats ────────────────────────────────────────────────────────────── */}
      <section className="bg-space-blue-900 py-14 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '4th', label: 'Largest US city' },
              { value: '90+', label: 'Languages spoken' },
              { value: '11,000+', label: 'Restaurants' },
              { value: '150+', label: 'Museums & galleries' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-4xl font-extrabold text-sunset-orange-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-space-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA ───────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sunset-orange-100 text-sunset-orange-600 flex items-center justify-center mx-auto mb-5">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Join the ExploreHTX Community
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          Get the best Houston events, neighborhood guides, and things to do
          delivered to your inbox every week. Free forever.
        </p>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-sunset-orange-500/25"
        >
          <Calendar className="w-5 h-5" />
          Subscribe — It&rsquo;s Free
        </Link>
      </section>
    </>
  );
}
