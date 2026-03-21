'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, MapPin, Calendar, Newspaper, Compass, Info, Utensils, Heart, Music, Clock, Building2, CalendarDays } from 'lucide-react';

const navLinks = [
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/saved', label: 'Saved Events', icon: Heart },
  { href: '/events/live-music', label: 'Live Music', icon: Music },
  { href: '/restaurants', label: 'Restaurants', icon: Utensils },
  { href: '/happy-hour', label: 'Happy Hour', icon: Clock },
  { href: '/venues', label: 'Venues', icon: Building2 },
  { href: '/blog', label: 'Blog', icon: Newspaper },
  { href: '/neighborhoods', label: 'Neighborhoods', icon: MapPin },
  { href: '/things-to-do', label: 'Things To Do', icon: Compass },
  { href: '/planner', label: 'Weekend Planner', icon: CalendarDays },
  { href: '/about', label: 'About', icon: Info },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-space-blue-800 transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-space-blue-900 z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-space-blue-700">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-sunset-orange-500" />
            <span className="text-white font-bold text-lg tracking-tight">ExploreHTX</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-300 hover:text-white hover:bg-space-blue-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <ul className="flex flex-col gap-1 px-4 py-6 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 hover:text-white hover:bg-space-blue-700 transition-colors font-medium text-base group"
              >
                <Icon
                  size={18}
                  className="text-sunset-orange-400 group-hover:text-sunset-orange-300 transition-colors flex-shrink-0"
                />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Subscribe CTA */}
        <div className="px-6 pb-8">
          <div className="mb-3 text-gray-400 text-sm text-center">
            Get Houston events in your inbox
          </div>
          <Link
            href="/subscribe"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-sunset-orange-500 hover:bg-sunset-orange-400 text-white font-semibold text-sm transition-colors shadow-lg"
          >
            Subscribe — It&apos;s Free
          </Link>
        </div>
      </nav>
    </>
  );
}
