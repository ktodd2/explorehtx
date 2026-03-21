import type { Restaurant } from '@/types/database';
import RestaurantCard from './RestaurantCard';

interface RestaurantGridProps {
  restaurants: Restaurant[];
  emptyMessage?: string;
}

export default function RestaurantGrid({
  restaurants,
  emptyMessage = 'No restaurants found.',
}: RestaurantGridProps) {
  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-3xl" role="img" aria-label="No results">
            🍽️
          </span>
        </div>
        <p className="text-gray-500 text-center max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
