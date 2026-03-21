'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useSavedEvents } from '@/hooks/useSavedEvents';

export default function SavedEventsLink() {
  const { count, isHydrated } = useSavedEvents();

  return (
    <Link
      href="/saved"
      className="relative flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
      aria-label={`Saved events${isHydrated && count > 0 ? ` (${count})` : ''}`}
    >
      <Heart
        size={15}
        className={`${count > 0 && isHydrated ? 'fill-houston-red text-houston-red' : 'text-sunset-orange-400'}`}
      />
      <span className="hidden sm:inline">Saved</span>
      {isHydrated && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 sm:-top-1 sm:-right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-houston-red text-white text-[10px] font-bold rounded-full px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
