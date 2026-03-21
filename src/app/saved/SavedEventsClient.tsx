'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Calendar, Trash2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import EventCard from '@/components/events/EventCard';
import { useSavedEvents } from '@/hooks/useSavedEvents';
import type { Event } from '@/types/database';

export default function SavedEventsClient() {
  const { savedIds, clearAll, isHydrated } = useSavedEvents();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch saved events from Supabase
  useEffect(() => {
    async function fetchSavedEvents() {
      if (!isHydrated || savedIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('id', savedIds)
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching saved events:', error);
        setEvents([]);
      } else {
        // Sort by the order they were saved (most recent first)
        const eventMap = new Map((data as Event[]).map((e) => [e.id, e]));
        const ordered = savedIds
          .map((id) => eventMap.get(id))
          .filter((e): e is Event => e !== undefined);
        setEvents(ordered);
      }
      setLoading(false);
    }

    fetchSavedEvents();
  }, [savedIds, isHydrated]);

  const handleClearAll = () => {
    if (window.confirm('Remove all saved events? This cannot be undone.')) {
      clearAll();
    }
  };

  // Loading state
  if (!isHydrated || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-5 bg-gray-200 rounded w-96 mb-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">
            No Saved Events
          </h1>
          <p className="text-gray-600 mb-8">
            Start exploring Houston events and tap the heart icon to save your favorites for later.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors shadow-md"
          >
            <Calendar className="w-5 h-5" />
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  // Events list
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
            Saved Events
          </h1>
          <p className="mt-2 text-gray-600">
            {events.length} event{events.length === 1 ? '' : 's'} saved
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-houston-red hover:bg-houston-red/5 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-sunset-orange-600 hover:text-sunset-orange-700 font-medium transition-colors"
          >
            Find More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Tip */}
      <div className="mt-12 p-6 bg-space-blue-50 rounded-2xl border border-space-blue-100">
        <p className="text-sm text-space-blue-800">
          <strong>Tip:</strong> Your saved events are stored in your browser.
          They&apos;ll be here next time you visit on the same device.
        </p>
      </div>
    </div>
  );
}
