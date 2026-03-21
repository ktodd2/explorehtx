import Link from 'next/link';
import { MapPin, Mail, Instagram, Twitter, Facebook, Youtube, Heart } from 'lucide-react';

const quickLinks = [
  { href: '/events', label: 'Upcoming Events' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/things-to-do', label: 'Things To Do' },
  { href: '/blog', label: 'Blog & Stories' },
  { href: '/neighborhoods', label: 'Neighborhoods' },
  { href: '/about', label: 'About Us' },
];

const eventFilters = [
  { href: '/events/today', label: 'Events Today' },
  { href: '/events/this-weekend', label: 'This Weekend' },
  { href: '/events/this-week', label: 'This Week' },
  { href: '/events/free', label: 'Free Events' },
  { href: '/restaurants/date-night', label: 'Date Night Restaurants' },
  { href: '/things-to-do/free', label: 'Free Things To Do' },
];

const categories = [
  { href: '/events/category/music-concerts', label: 'Concerts & Music' },
  { href: '/events/category/food-dining', label: 'Food & Dining' },
  { href: '/events/category/nightlife', label: 'Nightlife' },
  { href: '/events/category/arts-culture', label: 'Arts & Culture' },
  { href: '/events/category/sports', label: 'Sports & Recreation' },
  { href: '/events/category/family-kids', label: 'Family & Kids' },
];

const socialLinks = [
  { href: 'https://instagram.com/explorehtx', label: 'Instagram', icon: Instagram },
  { href: 'https://twitter.com/explorehtx', label: 'Twitter / X', icon: Twitter },
  { href: 'https://facebook.com/explorehtx', label: 'Facebook', icon: Facebook },
  { href: 'https://youtube.com/@explorehtx', label: 'YouTube', icon: Youtube },
];

export default function Footer() {
  return (
    <footer className="bg-space-blue-900 text-white">

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* About column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group" aria-label="ExploreHTX home">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sunset-orange-500 group-hover:bg-sunset-orange-400 transition-colors shadow">
                <MapPin size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-xl tracking-tight">
                Explore<span className="text-sunset-orange-400">HTX</span>
              </span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed mb-5">
              Your ultimate guide to Houston — events, restaurants, nightlife, neighborhoods, and everything the Bayou City has to offer.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-space-blue-700 hover:bg-sunset-orange-500 text-gray-300 hover:text-white transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-sunset-orange-400 mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-300 hover:text-white text-sm transition-colors hover:underline underline-offset-2"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Find Events */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-sunset-orange-400 mb-4">
              Find Events
            </h3>
            <ul className="space-y-2.5">
              {eventFilters.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-300 hover:text-white text-sm transition-colors hover:underline underline-offset-2"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-sunset-orange-400 mb-4">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {categories.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-300 hover:text-white text-sm transition-colors hover:underline underline-offset-2"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter signup */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-sunset-orange-400 mb-4">
              Stay in the Loop
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Get the best Houston events delivered weekly.
            </p>
            <form
              action="/subscribe"
              method="POST"
              className="flex flex-col gap-3"
              aria-label="Newsletter signup"
            >
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-space-blue-700 border border-space-blue-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-sunset-orange-500 hover:bg-sunset-orange-400 text-white font-semibold text-sm transition-colors shadow-md"
              >
                Subscribe Free
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-space-blue-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-sm text-center sm:text-left">
            &copy; 2026 ExploreHTX. Your guide to Houston events and things to do.
          </p>
          <p className="flex items-center gap-1.5 text-gray-400 text-sm">
            Built with <Heart size={13} className="text-houston-red fill-houston-red" /> in Houston, TX
          </p>
        </div>
      </div>

    </footer>
  );
}
