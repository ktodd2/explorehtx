'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface EventFiltersProps {
  categories: string[];
  neighborhoods: string[];
}

const DATE_OPTIONS = [
  { value: '', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-weekend', label: 'This Weekend' },
  { value: 'this-month', label: 'This Month' },
];

function labelForCategory(slug: string): string {
  const map: Record<string, string> = {
    'music-concerts': 'Music & Concerts',
    'sports': 'Sports',
    'food-dining': 'Food & Dining',
    'arts-culture': 'Arts & Culture',
    'nightlife': 'Nightlife',
    'family-kids': 'Family & Kids',
    'outdoor-parks': 'Outdoor & Parks',
    'festivals': 'Festivals',
    'free-events': 'Free Events',
    'comedy': 'Comedy',
    'theater': 'Theater',
    'markets-shopping': 'Markets & Shopping',
    'community': 'Community',
    'wellness': 'Wellness & Fitness',
    'film': 'Film & Cinema',
    'education': 'Education',
    'business': 'Business & Networking',
    'charity': 'Charity & Causes',
  };
  return (
    map[slug] ??
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

export default function EventFilters({
  categories,
  neighborhoods,
}: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset page on filter change
      params.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const date = searchParams.get('date') ?? '';
  const neighborhood = searchParams.get('neighborhood') ?? '';
  const free = searchParams.get('free') === 'true';

  const hasActiveFilters = !!(q || category || date || neighborhood || free);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <SlidersHorizontal className="w-4 h-4 text-sunset-orange-500" />
          Filter Events
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Clear all filters"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => updateParam('q', e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent focus:bg-white transition-colors placeholder-gray-400"
            disabled={isPending}
          />
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="py-2.5 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent focus:bg-white transition-colors text-gray-700 disabled:opacity-60"
          disabled={isPending}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {labelForCategory(cat)}
            </option>
          ))}
        </select>

        {/* Date */}
        <select
          value={date}
          onChange={(e) => updateParam('date', e.target.value)}
          className="py-2.5 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent focus:bg-white transition-colors text-gray-700 disabled:opacity-60"
          disabled={isPending}
          aria-label="Filter by date"
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Neighborhood */}
        <select
          value={neighborhood}
          onChange={(e) => updateParam('neighborhood', e.target.value)}
          className="py-2.5 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent focus:bg-white transition-colors text-gray-700 disabled:opacity-60"
          disabled={isPending}
          aria-label="Filter by neighborhood"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Free toggle — separate row */}
      <div className="mt-3 flex items-center gap-2.5">
        <button
          role="switch"
          aria-checked={free}
          onClick={() => updateParam('free', free ? '' : 'true')}
          disabled={isPending}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:ring-offset-1 disabled:opacity-60 ${
            free ? 'bg-emerald-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              free ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
        <label
          className="text-sm text-gray-600 cursor-pointer select-none"
          onClick={() => updateParam('free', free ? '' : 'true')}
        >
          Free events only
        </label>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-sunset-orange-400 border-t-transparent animate-spin" />
          Updating results…
        </div>
      )}
    </div>
  );
}
