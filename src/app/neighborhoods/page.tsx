import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Neighborhood } from '@/types/database';

export const metadata: Metadata = {
  title: 'Houston Neighborhoods Guide | ExploreHTX',
  description:
    'Explore Houston\'s diverse neighborhoods — from Montrose and Midtown to The Heights and EaDo. Find local events, restaurants, and things to do in every corner of the Bayou City.',
  alternates: {
    canonical: 'https://explorehtx.us.com/neighborhoods',
  },
};

interface NeighborhoodWithCount extends Neighborhood {
  event_count: number;
}

export default async function NeighborhoodsPage() {
  const supabase = await createClient();

  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  // Fetch event counts per neighborhood in one query
  const { data: eventCounts } = await supabase
    .from('events')
    .select('neighborhood')
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString());

  const countMap = new Map<string, number>();
  for (const row of eventCounts ?? []) {
    if (row.neighborhood) {
      countMap.set(
        row.neighborhood,
        (countMap.get(row.neighborhood) ?? 0) + 1
      );
    }
  }

  const items: NeighborhoodWithCount[] = (neighborhoods ?? []).map((n) => ({
    ...n,
    event_count: countMap.get(n.name) ?? 0,
  }));

  return (
    <>
      {/* Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative bg-space-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-space-blue-900 via-space-blue-800 to-space-blue-700 opacity-90" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-sunset-orange-500/20 text-sunset-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            Explore the Bayou City
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Houston{' '}
            <span className="text-sunset-orange-400">Neighborhoods</span>
          </h1>
          <p className="mt-5 text-lg text-space-blue-200 max-w-xl mx-auto leading-relaxed">
            From Montrose&rsquo;s eclectic art scene to Downtown&rsquo;s sports arenas,
            every Houston neighborhood has a story. Find events and things to do
            near you.
          </p>
        </div>
      </section>

      {/* Grid ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              Neighborhoods coming soon
            </h2>
            <p className="text-gray-500">
              We&rsquo;re building out neighborhood guides. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((neighborhood) => (
              <Link
                key={neighborhood.id}
                href={`/neighborhoods/${neighborhood.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                {/* Image or gradient placeholder */}
                {neighborhood.image_url ? (
                  <div className="relative h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={neighborhood.image_url}
                      alt={neighborhood.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-space-blue-100 to-space-blue-200 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-space-blue-400" />
                  </div>
                )}

                <div className="p-5">
                  <h2 className="font-display font-bold text-xl text-gray-900 group-hover:text-sunset-orange-600 transition-colors mb-2">
                    {neighborhood.name}
                  </h2>

                  {neighborhood.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                      {neighborhood.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-sunset-orange-500" />
                      <span>
                        {neighborhood.event_count > 0
                          ? `${neighborhood.event_count} upcoming ${neighborhood.event_count === 1 ? 'event' : 'events'}`
                          : 'No upcoming events'}
                      </span>
                    </div>
                    <span className="text-sm text-sunset-orange-600 font-medium group-hover:underline underline-offset-2">
                      Explore <ArrowRight className="inline w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
