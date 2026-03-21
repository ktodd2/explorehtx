import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, List, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import EventMapWrapper from '@/components/maps/EventMapWrapper';
import MapFilters from './MapFilters';
import type { Event } from '@/types/database';

export const metadata: Metadata = {
  title: 'Event Map | Find Events Near You in Houston',
  description:
    'Interactive map of Houston events. Find concerts, sports, food festivals, and more happening near you. Explore events by location.',
  alternates: {
    canonical: 'https://explorehtx.us.com/events/map',
  },
  openGraph: {
    title: 'Houston Events Map | ExploreHTX',
    description: 'Interactive map of Houston events. Find what\'s happening near you.',
    url: 'https://explorehtx.us.com/events/map',
    type: 'website',
  },
};

interface EventWithCoords extends Event {
  venue_lat: number;
  venue_lng: number;
}

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

async function fetchMapEvents(category?: string): Promise<EventWithCoords[]> {
  const supabase = await createClient();

  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .not('venue_lat', 'is', null)
    .not('venue_lng', 'is', null)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(200);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching map events:', error.message);
    return [];
  }

  // Filter to only events with valid coordinates
  return (data as Event[]).filter(
    (e): e is EventWithCoords =>
      e.venue_lat !== null && e.venue_lng !== null
  );
}

async function fetchCategories(): Promise<{ slug: string; name: string }[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('slug, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return data ?? [];
}

export default async function EventMapPage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const [events, categories] = await Promise.all([
    fetchMapEvents(category),
    fetchCategories(),
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/events" className="hover:text-gray-900 transition-colors">
              Events
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">Map</span>
          </nav>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/events"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <List className="w-4 h-4" />
              List View
            </Link>
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-space-blue-900 rounded-lg">
              <MapPin className="w-4 h-4" />
              Map View
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <MapFilters categories={categories} selectedCategory={category} />
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        {events.length > 0 ? (
          <>
            <EventMapWrapper events={events} />
            {/* Event count badge */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg px-4 py-2 border border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {events.length} events on map
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center p-8">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Events with Locations
              </h2>
              <p className="text-gray-500 mb-4 max-w-md">
                {category
                  ? `No ${category.replace('-', ' ')} events have location data available.`
                  : 'No events have location data available for the map view.'}
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                Browse All Events
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-500 font-medium">Categories:</span>
          <div className="flex flex-wrap gap-3">
            <LegendItem color="#f97316" label="Music" />
            <LegendItem color="#22c55e" label="Sports" />
            <LegendItem color="#ef4444" label="Food" />
            <LegendItem color="#a855f7" label="Arts" />
            <LegendItem color="#ec4899" label="Nightlife" />
            <LegendItem color="#3b82f6" label="Family" />
            <LegendItem color="#10b981" label="Outdoor" />
            <LegendItem color="#f59e0b" label="Festivals" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}
