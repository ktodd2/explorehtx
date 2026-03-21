'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { isRestaurantOpen, isAttractionOpen, getTodayHours } from '@/lib/utils/hours';
import type { RestaurantHours, AttractionHours } from '@/types/database';

interface OpenNowBadgeProps {
  hours: RestaurantHours | AttractionHours | null | undefined;
  type?: 'restaurant' | 'attraction';
  showHours?: boolean;
  className?: string;
}

export default function OpenNowBadge({
  hours,
  type = 'restaurant',
  showHours = false,
  className = '',
}: OpenNowBadgeProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [todayHours, setTodayHours] = useState<string | null>(null);

  // Check status on client side to ensure correct timezone
  useEffect(() => {
    const checkOpen = type === 'restaurant' ? isRestaurantOpen : isAttractionOpen;
    setIsOpen(checkOpen(hours));
    setTodayHours(getTodayHours(hours));
  }, [hours, type]);

  // Don't render until hydrated
  if (isOpen === null) return null;

  // Don't show if no hours data
  if (!hours || Object.keys(hours).length === 0) return null;

  if (isOpen) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Open
        </span>
        {showHours && todayHours && (
          <span className="text-xs text-gray-500">{todayHours}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-400 text-white text-xs font-semibold rounded-full">
        <Clock className="w-2.5 h-2.5" />
        Closed
      </span>
      {showHours && todayHours && (
        <span className="text-xs text-gray-500">{todayHours}</span>
      )}
    </div>
  );
}
