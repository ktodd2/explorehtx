import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import StarRating from './StarRating';
import type { Review, ReviewEntityType } from '@/types/database';

interface ReviewsSectionProps {
  entityType: ReviewEntityType;
  entityId: string;
  entityName: string;
}

async function fetchReviews(entityType: string, entityId: string): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching reviews:', error.message);
    return [];
  }

  return data as Review[];
}

function calculateStats(reviews: Review[]) {
  if (reviews.length === 0) {
    return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / reviews.length;

  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    distribution[r.rating - 1]++;
  });

  return { average, count: reviews.length, distribution };
}

export default async function ReviewsSection({
  entityType,
  entityId,
  entityName,
}: ReviewsSectionProps) {
  const reviews = await fetchReviews(entityType, entityId);
  const stats = calculateStats(reviews);

  return (
    <section className="mt-12 pt-10 border-t border-gray-100">
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Star className="w-6 h-6 text-amber-400" />
        Reviews
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-5 sticky top-24">
            {/* Average rating */}
            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-gray-900 mb-1">
                {stats.count > 0 ? stats.average.toFixed(1) : '—'}
              </p>
              <StarRating rating={stats.average} size="md" />
              <p className="text-sm text-gray-500 mt-2">
                {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating distribution */}
            {stats.count > 0 && (
              <div className="space-y-2 mb-6">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.distribution[rating - 1];
                  const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;

                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">{rating} star</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Review form */}
            <ReviewForm
              entityType={entityType}
              entityId={entityId}
              entityName={entityName}
            />
          </div>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2">
          <ReviewList reviews={reviews} />
        </div>
      </div>
    </section>
  );
}
