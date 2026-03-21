'use client';

import { Heart } from 'lucide-react';
import { useSavedEvents } from '@/hooks/useSavedEvents';

interface SaveEventButtonProps {
  eventId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function SaveEventButton({
  eventId,
  className = '',
  size = 'md',
  showLabel = false,
}: SaveEventButtonProps) {
  const { isSaved, toggleSave, isHydrated } = useSavedEvents();
  const saved = isSaved(eventId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(eventId);
  };

  // Show a placeholder during SSR/hydration to prevent layout shift
  if (!isHydrated) {
    return (
      <button
        type="button"
        disabled
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 ${className}`}
        aria-label="Loading..."
      >
        <Heart className={`${iconSizes[size]} text-gray-300`} />
      </button>
    );
  }

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
          saved
            ? 'bg-houston-red/10 text-houston-red border border-houston-red/20'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
        } ${className}`}
        aria-label={saved ? 'Remove from saved events' : 'Save this event'}
        aria-pressed={saved}
      >
        <Heart
          className={`${iconSizes[size]} transition-all duration-200 ${
            saved ? 'fill-houston-red text-houston-red scale-110' : ''
          }`}
        />
        <span className="text-sm font-medium">
          {saved ? 'Saved' : 'Save Event'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 ${
        saved
          ? 'bg-houston-red text-white shadow-md shadow-houston-red/25'
          : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-houston-red hover:bg-white shadow-sm border border-gray-100'
      } ${className}`}
      aria-label={saved ? 'Remove from saved events' : 'Save this event'}
      aria-pressed={saved}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform duration-200 ${
          saved ? 'fill-current scale-110' : ''
        }`}
      />
    </button>
  );
}
