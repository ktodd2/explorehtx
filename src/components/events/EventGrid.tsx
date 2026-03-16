import { Calendar } from 'lucide-react';
import type { Event } from '@/types/database';
import EventCard from './EventCard';

interface EventGridProps {
  events: Event[];
  emptyMessage?: string;
}

export default function EventGrid({
  events,
  emptyMessage = 'No events found. Check back soon!',
}: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-400 max-w-md">
          Houston events are being added daily. Bookmark this page and come
          back soon — there&apos;s always something happening in the Bayou
          City.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
