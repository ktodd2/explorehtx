import AdUnit from './AdUnit';

interface AdInFeedProps {
  slot: string;
  className?: string;
}

/**
 * Native in-feed ad that blends with the EventCard grid.
 * Drop this between event cards at a natural interval (e.g. every 6 cards).
 */
export default function AdInFeed({ slot, className = '' }: AdInFeedProps) {
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${className}`}
      aria-label="Advertisement"
    >
      <AdUnit
        slot={slot}
        format="auto"
        responsive
        className="min-h-[280px]"
      />
    </div>
  );
}
