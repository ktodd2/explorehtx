'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

interface MapFiltersProps {
  categories: { slug: string; name: string }[];
  selectedCategory?: string;
}

export default function MapFilters({ categories, selectedCategory }: MapFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    router.push(`/events/map?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* All categories button */}
      <button
        onClick={() => handleCategoryChange(null)}
        className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          !selectedCategory
            ? 'bg-space-blue-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        All Events
      </button>

      {/* Category buttons */}
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => handleCategoryChange(cat.slug)}
          className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            selectedCategory === cat.slug
              ? 'bg-space-blue-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {cat.name}
        </button>
      ))}

      {/* Clear filter */}
      {selectedCategory && (
        <button
          onClick={() => handleCategoryChange(null)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
