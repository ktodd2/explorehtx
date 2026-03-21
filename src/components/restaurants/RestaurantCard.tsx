import Link from 'next/link';
import Image from 'next/image';
import { MapPin, DollarSign, Utensils, Heart } from 'lucide-react';
import type { Restaurant } from '@/types/database';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

/** Map cuisine types to gradient classes for placeholder images */
const CUISINE_GRADIENTS: Record<string, string> = {
  'American': 'from-blue-600 to-blue-900',
  'Italian': 'from-green-600 to-green-900',
  'Japanese': 'from-rose-500 to-rose-800',
  'Mexican': 'from-amber-500 to-amber-800',
  'Steakhouse': 'from-red-700 to-red-950',
  'Southern': 'from-orange-500 to-orange-800',
  'Barbecue': 'from-amber-600 to-amber-900',
};

function cuisineGradient(type: string): string {
  return CUISINE_GRADIENTS[type] ?? 'from-space-blue-600 to-space-blue-900';
}

function formatPriceRange(range: string): string {
  return range; // Already formatted as $, $$, $$$, $$$$
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const gradient = cuisineGradient(restaurant.cuisine_type);
  const primaryLabel = restaurant.date_night_labels[0];

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
      aria-label={`View details for ${restaurant.name}`}
    >
      {/* Image / Placeholder */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {restaurant.image_url ? (
          <Image
            src={restaurant.image_url}
            alt={restaurant.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            aria-hidden="true"
          >
            <Utensils className="w-12 h-12 text-white/50" />
          </div>
        )}

        {/* Cuisine badge overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">
            <Utensils className="w-3 h-3" />
            {restaurant.cuisine_type}
          </span>
        </div>

        {/* Price range badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 bg-space-blue-900/80 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-sm">
            {formatPriceRange(restaurant.price_range)}
          </span>
        </div>

        {/* Date night label */}
        {primaryLabel && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sunset-orange-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-sm">
              <Heart className="w-3 h-3" />
              {primaryLabel}
            </span>
          </div>
        )}

        {/* Featured indicator */}
        {restaurant.featured && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2.5 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-sm">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-sunset-orange-600 transition-colors line-clamp-2">
          {restaurant.name}
        </h3>

        {restaurant.description && (
          <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {restaurant.description.slice(0, 120)}
            {restaurant.description.length > 120 ? '...' : ''}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto pt-4 space-y-1.5">
          {/* Neighborhood */}
          {restaurant.neighborhood && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
              <span className="truncate">{restaurant.neighborhood}</span>
            </div>
          )}

          {/* Price & Signature Dish */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-space-blue-700">
              {restaurant.avg_price_per_person
                ? `~$${restaurant.avg_price_per_person}/person`
                : formatPriceRange(restaurant.price_range)}
            </span>
            <span className="text-xs text-gray-400 group-hover:text-sunset-orange-500 transition-colors font-medium">
              View Menu &rsaquo;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
