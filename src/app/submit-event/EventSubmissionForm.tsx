'use client';

import { useState } from 'react';
import {
  Calendar,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  User,
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface EventSubmissionFormProps {
  categories: { slug: string; name: string }[];
}

interface FormData {
  // Step 1: Basics
  title: string;
  category: string;
  description: string;
  // Step 2: Date & Location
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_all_day: boolean;
  venue_name: string;
  venue_address: string;
  // Step 3: Details
  image_url: string;
  is_free: boolean;
  price_min: string;
  price_max: string;
  ticket_url: string;
  // Step 4: Organizer
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;
  organizer_website: string;
}

const STEPS = [
  { id: 1, name: 'Event Basics', icon: Calendar },
  { id: 2, name: 'Date & Location', icon: MapPin },
  { id: 3, name: 'Details', icon: ImageIcon },
  { id: 4, name: 'Your Info', icon: User },
];

export default function EventSubmissionForm({ categories }: EventSubmissionFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<FormData>({
    title: '',
    category: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    is_all_day: false,
    venue_name: '',
    venue_address: '',
    image_url: '',
    is_free: false,
    price_min: '',
    price_max: '',
    ticket_url: '',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    organizer_website: '',
  });

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepNum: number): string | null => {
    switch (stepNum) {
      case 1:
        if (!form.title.trim()) return 'Event title is required';
        if (!form.category) return 'Please select a category';
        if (form.description.length < 20) return 'Description must be at least 20 characters';
        break;
      case 2:
        if (!form.start_date) return 'Start date is required';
        if (!form.is_all_day && !form.start_time) return 'Start time is required';
        if (!form.venue_name.trim()) return 'Venue name is required';
        break;
      case 3:
        if (!form.is_free && form.price_min && isNaN(parseFloat(form.price_min))) {
          return 'Invalid minimum price';
        }
        break;
      case 4:
        if (!form.organizer_name.trim()) return 'Your name is required';
        if (!form.organizer_email.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.organizer_email)) {
          return 'Please enter a valid email';
        }
        break;
    }
    return null;
  };

  const nextStep = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const validationError = validateStep(4);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Combine date and time
      const startDateTime = form.is_all_day
        ? `${form.start_date}T00:00:00`
        : `${form.start_date}T${form.start_time}:00`;

      let endDateTime = null;
      if (form.end_date) {
        endDateTime = form.is_all_day
          ? `${form.end_date}T23:59:59`
          : form.end_time
            ? `${form.end_date}T${form.end_time}:00`
            : `${form.end_date}T23:59:59`;
      }

      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim(),
          start_date: startDateTime,
          end_date: endDateTime,
          is_all_day: form.is_all_day,
          venue_name: form.venue_name.trim(),
          venue_address: form.venue_address.trim() || null,
          image_url: form.image_url.trim() || null,
          is_free: form.is_free,
          price_min: form.is_free ? null : parseFloat(form.price_min) || null,
          price_max: form.is_free ? null : parseFloat(form.price_max) || null,
          ticket_url: form.ticket_url.trim() || null,
          organizer_name: form.organizer_name.trim(),
          organizer_email: form.organizer_email.toLowerCase().trim(),
          organizer_phone: form.organizer_phone.trim() || null,
          organizer_website: form.organizer_website.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit event');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-900 mb-2">Event Submitted!</h2>
        <p className="text-green-700 mb-6">
          Thank you for submitting your event. Our team will review it and get
          back to you within 1-2 business days.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setStep(1);
            setForm({
              title: '',
              category: '',
              description: '',
              start_date: '',
              start_time: '',
              end_date: '',
              end_time: '',
              is_all_day: false,
              venue_name: '',
              venue_address: '',
              image_url: '',
              is_free: false,
              price_min: '',
              price_max: '',
              ticket_url: '',
              organizer_name: '',
              organizer_email: '',
              organizer_phone: '',
              organizer_website: '',
            });
          }}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
        >
          Submit Another Event
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                  step >= s.id
                    ? 'bg-sunset-orange-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > s.id ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-16 lg:w-24 h-1 mx-2 rounded transition-colors ${
                    step > s.id ? 'bg-sunset-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={`text-xs font-medium ${
                step >= s.id ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Form steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Title <span className="text-houston-red">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="e.g., Summer Music Festival 2026"
                maxLength={255}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-houston-red">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => updateForm('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-houston-red">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Tell people what to expect at your event..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition resize-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                {form.description.length}/20 characters minimum
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date <span className="text-houston-red">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateForm('start_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
                />
              </div>
              {!form.is_all_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Time <span className="text-houston-red">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => updateForm('start_time', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_all_day}
                onChange={(e) => updateForm('is_all_day', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-sunset-orange-500 focus:ring-sunset-orange-500"
              />
              <span className="text-sm text-gray-700">All day event</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateForm('end_date', e.target.value)}
                  min={form.start_date || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
                />
              </div>
              {!form.is_all_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => updateForm('end_time', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Venue Name <span className="text-houston-red">*</span>
              </label>
              <input
                type="text"
                value={form.venue_name}
                onChange={(e) => updateForm('venue_name', e.target.value)}
                placeholder="e.g., Discovery Green"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Venue Address
              </label>
              <input
                type="text"
                value={form.venue_address}
                onChange={(e) => updateForm('venue_address', e.target.value)}
                placeholder="e.g., 1500 McKinney St, Houston, TX 77010"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Image URL
              </label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => updateForm('image_url', e.target.value)}
                placeholder="https://example.com/event-image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
              <p className="mt-1 text-xs text-gray-400">
                Recommended size: 1200x630px (landscape)
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) => updateForm('is_free', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-sunset-orange-500 focus:ring-sunset-orange-500"
              />
              <span className="text-sm text-gray-700">This is a free event</span>
            </label>

            {!form.is_free && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Min Price ($)
                  </label>
                  <input
                    type="number"
                    value={form.price_min}
                    onChange={(e) => updateForm('price_min', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max Price ($)
                  </label>
                  <input
                    type="number"
                    value={form.price_max}
                    onChange={(e) => updateForm('price_max', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ticket URL
              </label>
              <input
                type="url"
                value={form.ticket_url}
                onChange={(e) => updateForm('ticket_url', e.target.value)}
                placeholder="https://tickets.example.com/my-event"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Name <span className="text-houston-red">*</span>
              </label>
              <input
                type="text"
                value={form.organizer_name}
                onChange={(e) => updateForm('organizer_name', e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-houston-red">*</span>
              </label>
              <input
                type="email"
                value={form.organizer_email}
                onChange={(e) => updateForm('organizer_email', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
              <p className="mt-1 text-xs text-gray-400">
                We&apos;ll contact you about your submission
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.organizer_phone}
                onChange={(e) => updateForm('organizer_phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Website
              </label>
              <input
                type="url"
                value={form.organizer_website}
                onChange={(e) => updateForm('organizer_website', e.target.value)}
                placeholder="https://myorganization.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-colors ${
              step === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Event
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
