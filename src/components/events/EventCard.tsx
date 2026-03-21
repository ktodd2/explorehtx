import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Tag } from 'lucide-react';
import type { Event } from '@/types/database';
import { formatEventDate } from '@/lib/utils/dates';
import { formatPrice, truncate, categoryDisplayName } from '@/lib/utils/format';
import SaveEventButton from './SaveEventButton';

interface EventCardProps {
  event: Event;
}

/** Map category slugs to gradient classes for placeholder images */
const CATEGORY_GRADIENTS: Record<string, string> = {
  'music-concerts': 'from-purple-600 to-purple-900',
  'sports': 'from-green-600 to-green-900',
  'food-dining': 'from-amber-500 to-amber-800',
  'arts-culture': 'from-pink-500 to-pink-900',
  'nightlife': 'from-indigo-600 to-indigo-900',
  'family-kids': 'from-cyan-500 to-cyan-800',
  'outdoor-parks': 'from-emerald-500 to-emerald-900',
  'festivals': 'from-rose-500 to-rose-800',
  'comedy': 'from-yellow-500 to-amber-700',
  'theater': 'from-fuchsia-500 to-fuchsia-900',
  'markets-shopping': 'from-orange-400 to-orange-700',
};

function categoryGradient(slug: string): string {
  return CATEGORY_GRADIENTS[slug] ?? 'from-space-blue-600 to-space-blue-900';
}

export default function EventCard({ event }: EventCardProps) {
  const price = formatPrice(event.price_min, event.price_max, event.is_free);
  const gradient = categoryGradient(event.category);
  const categoryName = categoryDisplayName(event.category);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
      aria-label={`View details for ${event.title}`}
    >
      {/* Image / Placeholder */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.image_alt ?? event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            aria-hidden="true"
          >
            <Calendar className="w-12 h-12 text-white/50" />
          </div>
        )}

        {/* Category badge overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">
            <Tag className="w-3 h-3" />
            {categoryName}
          </span>
        </div>

        {/* Free badge */}
        {event.is_free && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
              Free
            </span>
          </div>
        )}

        {/* Featured indicator */}
        {event.featured && !event.is_free && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-sunset-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
              Featured
            </span>
          </div>
        )}

        {/* Save button */}
        <div className="absolute bottom-3 right-3">
          <SaveEventButton eventId={event.id} size="sm" />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-sunset-orange-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {truncate(event.description, 120)}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto pt-4 space-y-1.5">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
            <span className="truncate">{formatEventDate(event.start_date)}</span>
          </div>

          {/* Venue / Location */}
          {(event.venue_name || event.neighborhood) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
              <span className="truncate">
                {event.venue_name ?? event.neighborhood}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <span
              className={`text-sm font-semibold ${
                event.is_free
                  ? 'text-emerald-600'
                  : 'text-space-blue-700'
              }`}
            >
              {price}
            </span>
            <span className="text-xs text-gray-400 group-hover:text-sunset-orange-500 transition-colors font-medium">
              Details &rsaquo;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
