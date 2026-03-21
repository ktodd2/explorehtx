import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, DollarSign, Gift, Landmark } from 'lucide-react';
import type { Attraction, AttractionCategory } from '@/types/database';
import OpenNowBadge from '@/components/filters/OpenNowBadge';

interface AttractionCardProps {
  attraction: Attraction;
  category?: AttractionCategory | null;
}

/** Map category slugs to gradient classes for placeholder images */
const CATEGORY_GRADIENTS: Record<string, string> = {
  'museums-culture': 'from-purple-600 to-purple-900',
  'parks-nature': 'from-emerald-600 to-emerald-900',
  'free-activities': 'from-amber-500 to-amber-800',
  'neighborhoods': 'from-blue-600 to-blue-900',
  'family-fun': 'from-pink-500 to-pink-800',
  'outdoor-adventures': 'from-teal-600 to-teal-900',
  'local-experiences': 'from-orange-500 to-orange-800',
  'sports-recreation': 'from-red-600 to-red-900',
};

function categoryGradient(slug: string | undefined): string {
  return slug && CATEGORY_GRADIENTS[slug]
    ? CATEGORY_GRADIENTS[slug]
    : 'from-space-blue-600 to-space-blue-900';
}

/** Price type badge colors and labels */
const PRICE_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-emerald-500 text-white' },
  paid: { label: 'Paid', className: 'bg-space-blue-900/80 text-white' },
  donation: { label: 'Donation', className: 'bg-amber-500 text-white' },
  varies: { label: 'Varies', className: 'bg-gray-700 text-white' },
};

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function AttractionCard({ attraction, category }: AttractionCardProps) {
  const categorySlug = category?.slug;
  const gradient = categoryGradient(categorySlug);
  const priceConfig = PRICE_TYPE_CONFIG[attraction.price_type] || PRICE_TYPE_CONFIG.varies;
  const duration = formatDuration(attraction.duration_minutes);

  return (
    <Link
      href={`/things-to-do/${attraction.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
      aria-label={`View details for ${attraction.name}`}
    >
      {/* Image / Placeholder */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {attraction.image_url ? (
          <Image
            src={attraction.image_url}
            alt={attraction.image_alt ?? attraction.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            aria-hidden="true"
          >
            <Landmark className="w-12 h-12 text-white/50" />
          </div>
        )}

        {/* Category badge overlay */}
        {category && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">
              {category.name}
            </span>
          </div>
        )}

        {/* Price type badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-sm ${priceConfig.className}`}>
            {attraction.price_type === 'free' ? (
              <Gift className="w-3 h-3" />
            ) : (
              <DollarSign className="w-3 h-3" />
            )}
            {priceConfig.label}
            {attraction.price_range && attraction.price_type === 'paid' && (
              <span className="ml-0.5">({attraction.price_range})</span>
            )}
          </span>
        </div>

        {/* Featured indicator */}
        {attraction.featured && (
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
          {attraction.name}
        </h3>

        {attraction.short_description && (
          <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {attraction.short_description}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto pt-4 space-y-1.5">
          {/* Open status + Neighborhood */}
          <div className="flex items-center gap-2 flex-wrap">
            <OpenNowBadge hours={attraction.hours} type="attraction" />
            {attraction.neighborhood && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-sunset-orange-500 flex-shrink-0" />
                <span className="truncate">{attraction.neighborhood}</span>
              </div>
            )}
          </div>

          {/* Duration & CTA */}
          <div className="flex items-center justify-between pt-1">
            {duration ? (
              <span className="flex items-center gap-1 text-sm text-space-blue-700 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {duration} visit
              </span>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400 group-hover:text-sunset-orange-500 transition-colors font-medium">
              Explore &rsaquo;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
