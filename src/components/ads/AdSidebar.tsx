import AdUnit from './AdUnit';

interface AdSidebarProps {
  slot: string;
  sticky?: boolean;
  className?: string;
}

/**
 * Medium rectangle (300×250) sidebar ad.
 * Pass sticky=true to keep it in view as the user scrolls.
 */
export default function AdSidebar({
  slot,
  sticky = false,
  className = '',
}: AdSidebarProps) {
  return (
    <div
      className={`w-full ${sticky ? 'sticky top-24' : ''} ${className}`}
      aria-label="Advertisement"
    >
      <AdUnit
        slot={slot}
        format="rectangle"
        responsive={false}
        className="w-[300px] min-h-[250px] mx-auto"
      />
    </div>
  );
}
