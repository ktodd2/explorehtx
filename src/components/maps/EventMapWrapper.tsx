'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { Event } from '@/types/database';

// Dynamically import the map component with no SSR
const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

interface EventWithCoords extends Event {
  venue_lat: number;
  venue_lng: number;
}

interface EventMapWrapperProps {
  events: EventWithCoords[];
  center?: [number, number];
  zoom?: number;
}

export default function EventMapWrapper({ events, center, zoom }: EventMapWrapperProps) {
  return <EventMap events={events} center={center} zoom={zoom} />;
}
