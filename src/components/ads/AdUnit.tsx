'use client';

import { useEffect, useRef } from 'react';

// Extend the Window interface to include adsbygoogle
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export type AdFormat = 'auto' | 'rectangle' | 'horizontal' | 'vertical';

interface AdUnitProps {
  slot: string;
  format?: AdFormat;
  responsive?: boolean;
  className?: string;
}

const isDev = process.env.NODE_ENV !== 'production';

export default function AdUnit({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}: AdUnitProps) {
  const pushed = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    // Only push once per mount — guard against StrictMode double-effect
    if (pushed.current) return;
    if (isDev || !clientId) return;

    try {
      pushed.current = true;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle not yet loaded — Script tag in layout will initialise it
    }
  }, [clientId]);

  // ── Development placeholder ──────────────────────────────────────────────
  if (isDev || !clientId) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded-lg text-gray-400 text-xs font-medium select-none ${className}`}
        aria-hidden="true"
      >
        Ad
      </div>
    );
  }

  // ── Production AdSense ins tag ────────────────────────────────────────────
  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}
