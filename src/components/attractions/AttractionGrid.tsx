import type { Attraction, AttractionCategory } from '@/types/database';
import AttractionCard from './AttractionCard';

interface AttractionGridProps {
  attractions: Attraction[];
  categories?: Map<string, AttractionCategory>;
  emptyMessage?: string;
}

export default function AttractionGrid({
  attractions,
  categories,
  emptyMessage = 'No attractions found.',
}: AttractionGridProps) {
  if (attractions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-3xl" role="img" aria-label="No results">
            🏛️
          </span>
        </div>
        <p className="text-gray-500 text-center max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {attractions.map((attraction) => (
        <AttractionCard
          key={attraction.id}
          attraction={attraction}
          category={
            attraction.category_id && categories
              ? categories.get(attraction.category_id)
              : undefined
          }
        />
      ))}
    </div>
  );
}
