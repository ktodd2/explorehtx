import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Calendar, FileText, ArrowRight } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';

export const metadata: Metadata = {
  title: 'Page Not Found | ExploreHTX',
  description: 'The page you were looking for does not exist. Explore Houston events, neighborhoods, and local guides on ExploreHTX.',
  robots: { index: false, follow: true },
};

const POPULAR_LINKS = [
  {
    href: '/events',
    label: 'All Events',
    description: 'Browse every upcoming event in Houston',
    icon: Calendar,
  },
  {
    href: '/events/this-weekend',
    label: 'This Weekend',
    description: 'What\'s happening in the next few days',
    icon: Calendar,
  },
  {
    href: '/events/free',
    label: 'Free Events',
    description: 'Great things to do without spending a dime',
    icon: Calendar,
  },
  {
    href: '/blog',
    label: 'Blog',
    description: 'Houston guides, neighborhood spotlights, and more',
    icon: FileText,
  },
  {
    href: '/neighborhoods',
    label: 'Neighborhoods',
    description: 'Explore Houston\'s diverse areas',
    icon: MapPin,
  },
];

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative bg-space-blue-900 overflow-hidden flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-space-blue-900 via-space-blue-800 to-space-blue-700 opacity-90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">

          {/* 404 number */}
          <div className="font-display text-[120px] sm:text-[180px] font-extrabold leading-none text-space-blue-700 select-none mb-0 -mb-4">
            404
          </div>

          <div className="inline-flex items-center gap-2 bg-sunset-orange-500/20 text-sunset-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-5">
            <MapPin className="w-4 h-4" />
            Somewhere in Houston…
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            This page got lost in the Bayou City
          </h1>

          <p className="text-space-blue-200 text-lg mb-10 max-w-md mx-auto">
            The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
            Let&rsquo;s get you back on track.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-8">
            <SearchBar
              size="lg"
              placeholder="Search Houston events…"
            />
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-sunset-orange-500/25"
          >
            Back to Home
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Suggestions ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="font-display text-2xl font-bold text-gray-900 text-center mb-8">
          Popular pages to explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-sunset-orange-100 text-sunset-orange-600 flex items-center justify-center flex-shrink-0 group-hover:bg-sunset-orange-500 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-sunset-orange-600 transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                    {link.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
