'use client';

import { useState } from 'react';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import StarRating from './StarRating';
import type { ReviewEntityType } from '@/types/database';

interface ReviewFormProps {
  entityType: ReviewEntityType;
  entityId: string;
  entityName: string;
  onSuccess?: () => void;
}

interface FormState {
  rating: number;
  title: string;
  content: string;
  reviewerName: string;
  reviewerEmail: string;
}

export default function ReviewForm({
  entityType,
  entityId,
  entityName,
  onSuccess,
}: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormState>({
    rating: 0,
    title: '',
    content: '',
    reviewerName: '',
    reviewerEmail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (form.rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (form.content.length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          rating: form.rating,
          title: form.title || null,
          content: form.content,
          reviewer_name: form.reviewerName,
          reviewer_email: form.reviewerEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setForm({ rating: 0, title: '', content: '', reviewerName: '', reviewerEmail: '' });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-green-900 mb-1">Thank You!</h3>
        <p className="text-green-700 text-sm">
          Your review has been submitted and is pending approval.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setIsOpen(false);
          }}
          className="mt-4 text-sm text-green-600 hover:text-green-800 font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
      >
        Write a Review
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">
        Review {entityName}
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating <span className="text-houston-red">*</span>
        </label>
        <StarRating
          rating={form.rating}
          size="lg"
          interactive
          onChange={(rating) => setForm({ ...form, rating })}
        />
      </div>

      {/* Title (optional) */}
      <div className="mb-4">
        <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1.5">
          Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Summarize your experience"
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
        />
      </div>

      {/* Review content */}
      <div className="mb-4">
        <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1.5">
          Your Review <span className="text-houston-red">*</span>
        </label>
        <textarea
          id="review-content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="Share your experience..."
          rows={4}
          required
          minLength={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition resize-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          {form.content.length}/10 characters minimum
        </p>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label htmlFor="reviewer-name" className="block text-sm font-medium text-gray-700 mb-1.5">
          Your Name <span className="text-houston-red">*</span>
        </label>
        <input
          id="reviewer-name"
          type="text"
          value={form.reviewerName}
          onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
          placeholder="John D."
          required
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
        />
      </div>

      {/* Email */}
      <div className="mb-5">
        <label htmlFor="reviewer-email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Your Email <span className="text-houston-red">*</span>
        </label>
        <input
          id="reviewer-email"
          type="email"
          value={form.reviewerEmail}
          onChange={(e) => setForm({ ...form, reviewerEmail: e.target.value })}
          placeholder="john@example.com"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
        />
        <p className="mt-1 text-xs text-gray-400">
          Your email won&apos;t be published
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-sunset-orange-500 hover:bg-sunset-orange-600 disabled:bg-gray-300 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          {isSubmitting ? (
            'Submitting...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
