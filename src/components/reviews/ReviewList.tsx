import { MessageSquare, User } from 'lucide-react';
import StarRating from './StarRating';
import type { Review } from '@/types/database';

interface ReviewListProps {
  reviews: Review[];
  showEmpty?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ReviewList({ reviews, showEmpty = true }: ReviewListProps) {
  if (reviews.length === 0 && showEmpty) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <article key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{review.reviewer_name}</p>
                <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
              </div>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
          )}

          {/* Content */}
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {review.content}
          </p>

          {/* Helpful count */}
          {review.helpful_count > 0 && (
            <p className="mt-3 text-xs text-gray-400">
              {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
