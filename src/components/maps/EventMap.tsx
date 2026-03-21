'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import type { Event } from '@/types/database';

import 'leaflet/dist/leaflet.css';
import '@/app/events/map/map-styles.css';

// Fix Leaflet default marker icon issue - use CDN
const LEAFLET_CDN = 'https://unpkg.com/leaflet@1.9.4/dist/images';
L.Icon.Default.mergeOptions({
  iconUrl: `${LEAFLET_CDN}/marker-icon.png`,
  iconRetinaUrl: `${LEAFLET_CDN}/marker-icon-2x.png`,
  shadowUrl: `${LEAFLET_CDN}/marker-shadow.png`,
});

// Custom colored marker for different categories
function getCategoryIcon(category: string): L.DivIcon {
  const colors: Record<string, string> = {
    'music-concerts': '#f97316', // orange
    'sports': '#22c55e', // green
    'food-dining': '#ef4444', // red
    'arts-culture': '#a855f7', // purple
    'nightlife': '#ec4899', // pink
    'family-kids': '#3b82f6', // blue
    'outdoor-parks': '#10b981', // emerald
    'festivals': '#f59e0b', // amber
    'free-events': '#14b8a6', // teal
    'comedy': '#eab308', // yellow
    'theater': '#8b5cf6', // violet
    'markets-shopping': '#06b6d4', // cyan
  };

  const color = colors[category] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

interface EventWithCoords extends Event {
  venue_lat: number;
  venue_lng: number;
}

interface EventMapProps {
  events: EventWithCoords[];
  center?: [number, number];
  zoom?: number;
  selectedCategory?: string;
}

function MapBoundsHandler({ events }: { events: EventWithCoords[] }) {
  const map = useMap();

  useEffect(() => {
    if (events.length === 0) return;

    const bounds = L.latLngBounds(
      events.map((e) => [e.venue_lat, e.venue_lng] as [number, number])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [events, map]);

  return null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPrice(event: Event): string {
  if (event.is_free) return 'Free';
  if (event.price_min && event.price_max) {
    return `$${event.price_min} - $${event.price_max}`;
  }
  if (event.price_min) return `From $${event.price_min}`;
  return 'See details';
}

export default function EventMap({
  events,
  center = [29.7604, -95.3698], // Houston center
  zoom = 11,
}: EventMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
        <MapPin className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsHandler events={events} />

      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.venue_lat, event.venue_lng]}
          icon={getCategoryIcon(event.category)}
        >
          <Popup className="event-popup" maxWidth={300}>
            <div className="p-1">
              {/* Event image */}
              {event.image_url && (
                <div className="w-full h-24 rounded-lg overflow-hidden mb-3 -mt-1 -mx-1">
                  <img
                    src={event.image_url}
                    alt={event.image_alt || event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <Link
                href={`/events/${event.slug}`}
                className="font-semibold text-gray-900 hover:text-sunset-orange-600 line-clamp-2 text-sm"
              >
                {event.title}
              </Link>

              {/* Date */}
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
                {formatDate(event.start_date)}
              </div>

              {/* Venue */}
              {event.venue_name && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
                  <span className="line-clamp-1">{event.venue_name}</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
                <Ticket className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
                {formatPrice(event)}
              </div>

              {/* View button */}
              <Link
                href={`/events/${event.slug}`}
                className="block mt-3 w-full text-center py-2 px-3 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                View Event
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
