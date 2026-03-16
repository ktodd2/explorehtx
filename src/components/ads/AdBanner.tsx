import AdUnit from './AdUnit';

interface AdBannerProps {
  slot: string;
  className?: string;
}

/**
 * Leaderboard (728×90) style ad banner.
 * Centered with max-width constraint and vertical breathing room.
 */
export default function AdBanner({ slot, className = '' }: AdBannerProps) {
  return (
    <div className={`w-full my-6 flex justify-center ${className}`}>
      <div className="w-full max-w-4xl">
        <AdUnit
          slot={slot}
          format="horizontal"
          responsive
          className="min-h-[90px]"
        />
      </div>
    </div>
  );
}
