import Link from 'next/link';
import {
  Calendar,
  Music,
  Utensils,
  Palette,
  Moon,
  Users,
  TreePine,
  PartyPopper,
  Gift,
  Laugh,
  Theater,
  ShoppingBag,
  Trophy,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventCard from '@/components/events/EventCard';
import BlogCard from '@/components/blog/BlogCard';
import type { Event, BlogPost } from '@/types/database';

const CATEGORIES = [
  { name: 'Music & Concerts', slug: 'music-concerts', icon: Music, color: 'bg-purple-100 text-purple-700' },
  { name: 'Sports', slug: 'sports', icon: Trophy, color: 'bg-green-100 text-green-700' },
  { name: 'Food & Dining', slug: 'food-dining', icon: Utensils, color: 'bg-amber-100 text-amber-700' },
  { name: 'Arts & Culture', slug: 'arts-culture', icon: Palette, color: 'bg-pink-100 text-pink-700' },
  { name: 'Nightlife', slug: 'nightlife', icon: Moon, color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Family & Kids', slug: 'family-kids', icon: Users, color: 'bg-cyan-100 text-cyan-700' },
  { name: 'Outdoor & Parks', slug: 'outdoor-parks', icon: TreePine, color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Festivals', slug: 'festivals', icon: PartyPopper, color: 'bg-rose-100 text-rose-700' },
  { name: 'Free Events', slug: 'free-events', icon: Gift, color: 'bg-teal-100 text-teal-700' },
  { name: 'Comedy', slug: 'comedy', icon: Laugh, color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Theater', slug: 'theater', icon: Theater, color: 'bg-fuchsia-100 text-fuchsia-700' },
  { name: 'Markets & Shopping', slug: 'markets-shopping', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700' },
];

const QUICK_LINKS = [
  { label: 'Today', href: '/events/today', icon: Clock, description: 'Happening right now' },
  { label: 'This Weekend', href: '/events/this-weekend', icon: Calendar, description: 'Weekend plans sorted' },
  { label: 'Free Events', href: '/events/free', icon: Gift, description: 'No budget needed' },
  { label: 'This Month', href: '/events/this-month', icon: Sparkles, description: 'Full month ahead' },
];

export default async function Home() {
  const supabase = await createClient();

  const [eventsResult, blogResult] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString())
      .order('featured', { ascending: false })
      .order('start_date', { ascending: true })
      .limit(6),
    supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3),
  ]);

  const events = (eventsResult.data as Event[]) ?? [];
  const blogPosts = (blogResult.data as BlogPost[]) ?? [];

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-space-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-space-blue-900 via-space-blue-800 to-space-blue-700 opacity-90" />
        <div className="absolute inset-0 bg-[url('/images/houston-pattern.svg')] opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-sunset-orange-500/20 text-sunset-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              Your Guide to Houston, Texas
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
              Discover What&apos;s{' '}
              <span className="text-sunset-orange-400">Happening</span>{' '}
              in Houston
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-space-blue-200 max-w-2xl mx-auto leading-relaxed">
              Events, concerts, food, nightlife, and everything in between.
              Updated daily so you never miss a thing in the Bayou City.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-sunset-orange-500/25"
              >
                <Calendar className="w-5 h-5" />
                Browse Events
              </Link>
              <Link
                href="/events/this-weekend"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors backdrop-blur-sm border border-white/20"
              >
                This Weekend
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 46.7C840 53.3 960 66.7 1080 70C1200 73.3 1320 66.7 1380 63.3L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-sunset-orange-200 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sunset-orange-100 text-sunset-orange-600 flex items-center justify-center group-hover:bg-sunset-orange-500 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{link.label}</h3>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Upcoming Events
            </h2>
            <p className="mt-2 text-gray-600">Don&apos;t miss what&apos;s happening in Houston</p>
          </div>
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-2 text-sunset-orange-600 hover:text-sunset-orange-700 font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">
            No upcoming events yet. Check back soon!
          </p>
        )}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
          >
            View All Events
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <p className="mt-2 text-gray-600">Find exactly what you&apos;re looking for</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/events/category/${cat.slug}`}
                  className="group bg-white rounded-2xl p-5 text-center hover:shadow-lg transition-all duration-200 border border-gray-100 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* From the Blog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              From the Blog
            </h2>
            <p className="mt-2 text-gray-600">Local insights and Houston guides</p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-2 text-sunset-orange-600 hover:text-sunset-orange-700 font-medium transition-colors"
          >
            All Posts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {blogPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Weekend Guide', 'Neighborhood Spotlight', 'Best Free Events'].map((title) => (
              <div
                key={title}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="h-40 bg-gradient-to-br from-sunset-orange-100 to-sunset-orange-200 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-sunset-orange-400" />
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-sunset-orange-600 uppercase tracking-wide">
                    Coming Soon
                  </span>
                  <h3 className="font-semibold text-gray-900 text-lg mt-1">{title}</h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    AI-generated blog posts about Houston events will appear here automatically.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-space-blue-900 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Never Miss a Houston Event
          </h2>
          <p className="mt-4 text-space-blue-200 text-lg">
            Get a weekly roundup of the best events, hidden gems, and things to do
            delivered to your inbox every Friday.
          </p>
          <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-space-blue-300 focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sunset-orange-500/25"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-4 text-sm text-space-blue-300">
            Free. No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </>
  );
}
