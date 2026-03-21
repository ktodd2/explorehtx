import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import MobileNav from './MobileNav';
import SavedEventsLink from './SavedEventsLink';

const navLinks = [
  { href: '/events', label: 'Events' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/blog', label: 'Blog' },
  { href: '/neighborhoods', label: 'Neighborhoods' },
  { href: '/things-to-do', label: 'Things To Do' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-space-blue-900 border-b border-space-blue-700 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 group flex-shrink-0"
            aria-label="ExploreHTX home"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sunset-orange-500 group-hover:bg-sunset-orange-400 transition-colors shadow-md">
              <MapPin size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight leading-none">
              Explore<span className="text-sunset-orange-400">HTX</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-space-blue-700 transition-colors font-medium text-sm"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Events quick-link — desktop only */}
            <Link
              href="/events"
              className="hidden md:flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
              aria-label="Browse events"
            >
              <Calendar size={15} className="text-sunset-orange-400" />
              <span>Events</span>
            </Link>

            {/* Saved events link */}
            <div className="hidden md:block">
              <SavedEventsLink />
            </div>

            {/* Subscribe CTA — desktop */}
            <Link
              href="/subscribe"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sunset-orange-500 hover:bg-sunset-orange-400 text-white font-semibold text-sm transition-colors shadow-md"
            >
              Subscribe
            </Link>

            {/* Mobile menu — client component */}
            <MobileNav />
          </div>

        </div>
      </div>
    </header>
  );
}
