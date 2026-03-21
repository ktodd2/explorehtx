'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Check } from 'lucide-react';
import { isRestaurantOpen, isAttractionOpen, getCurrentDay } from '@/lib/utils/hours';
import type { Restaurant, Attraction } from '@/types/database';

interface OpenNowFilterProps<T extends Restaurant | Attraction> {
  items: T[];
  onFilterChange: (filtered: T[]) => void;
  type?: 'restaurant' | 'attraction';
  className?: string;
}

export default function OpenNowFilter<T extends Restaurant | Attraction>({
  items,
  onFilterChange,
  type = 'restaurant',
  className = '',
}: OpenNowFilterProps<T>) {
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [currentDay, setCurrentDay] = useState('');

  // Calculate open count
  useEffect(() => {
    const checkOpen = type === 'restaurant' ? isRestaurantOpen : isAttractionOpen;
    const count = items.filter((item) => checkOpen(item.hours)).length;
    setOpenCount(count);
    setCurrentDay(getCurrentDay());
  }, [items, type]);

  // Apply filter when toggle changes
  const handleToggle = useCallback(() => {
    const newValue = !showOpenOnly;
    setShowOpenOnly(newValue);

    if (newValue) {
      const checkOpen = type === 'restaurant' ? isRestaurantOpen : isAttractionOpen;
      const filtered = items.filter((item) => checkOpen(item.hours));
      onFilterChange(filtered);
    } else {
      onFilterChange(items);
    }
  }, [showOpenOnly, items, onFilterChange, type]);

  // Don't show if no items have hours
  const hasHoursData = items.some((item) => item.hours && Object.keys(item.hours).length > 0);
  if (!hasHoursData) return null;

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
        showOpenOnly
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
      } ${className}`}
      aria-pressed={showOpenOnly}
    >
      <div className="relative">
        <Clock className="w-4 h-4" />
        {showOpenOnly && (
          <Check className="absolute -top-1 -right-1 w-3 h-3 text-emerald-600" />
        )}
      </div>
      <span className="text-sm font-medium">
        Open Now
        {openCount > 0 && (
          <span className={`ml-1.5 ${showOpenOnly ? 'text-emerald-600' : 'text-gray-400'}`}>
            ({openCount})
          </span>
        )}
      </span>
      {currentDay && (
        <span className="text-xs text-gray-400 hidden sm:inline">
          {currentDay}
        </span>
      )}
    </button>
  );
}
