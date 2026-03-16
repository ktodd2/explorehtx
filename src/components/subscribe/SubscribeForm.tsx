'use client';

import { useState } from 'react';

const CATEGORIES = [
  { slug: 'music-concerts', label: 'Music & Concerts' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'food-dining', label: 'Food & Dining' },
  { slug: 'arts-culture', label: 'Arts & Culture' },
  { slug: 'nightlife', label: 'Nightlife' },
  { slug: 'family-kids', label: 'Family & Kids' },
  { slug: 'outdoor-parks', label: 'Outdoor & Parks' },
  { slug: 'festivals', label: 'Festivals' },
  { slug: 'free-events', label: 'Free Events' },
  { slug: 'comedy', label: 'Comedy' },
  { slug: 'theater', label: 'Theater' },
  { slug: 'markets-shopping', label: 'Markets & Shopping' },
];

const NEIGHBORHOODS = [
  'Midtown', 'Montrose', 'Heights', 'Downtown', 'Museum District',
  'River Oaks', 'EaDo', 'Greenway Plaza', 'Upper Kirby', 'Galleria',
  'Sugar Land', 'The Woodlands', 'Katy', 'Clear Lake', 'Pearland',
];

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || null,
          categories: selectedCategories,
          neighborhoods: selectedNeighborhood ? [selectedNeighborhood] : [],
        }),
      });

      const json = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(json.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-4">&#9993;</div>
          <h2 className="text-2xl font-bold text-space-blue-900 mb-3">
            Check your inbox!
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We sent a verification email to{' '}
            <strong className="text-gray-900">{email}</strong>. Click the link
            in the email to confirm your subscription.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            Didn&apos;t receive it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20 grid lg:grid-cols-5 gap-10">
      {/* Form */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-space-blue-900 mb-6">
            Subscribe for free
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address <span className="text-sunset-orange-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-space-blue-900 focus:outline-none focus:ring-2 focus:ring-space-blue-900/20 transition"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                First name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-space-blue-900 focus:outline-none focus:ring-2 focus:ring-space-blue-900/20 transition"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                What are you interested in? <span className="text-gray-400 font-normal">(pick any)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const checked = selectedCategories.includes(cat.slug);
                  return (
                    <label
                      key={cat.slug}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 cursor-pointer transition select-none text-sm font-medium ${
                        checked
                          ? 'border-space-blue-900 bg-space-blue-900/5 text-space-blue-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleCategory(cat.slug)}
                      />
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition ${
                          checked ? 'bg-space-blue-900 border-space-blue-900' : 'border-gray-300 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {cat.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="neighborhood" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Neighborhood <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                id="neighborhood"
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-space-blue-900 focus:outline-none focus:ring-2 focus:ring-space-blue-900/20 transition bg-white appearance-none"
              >
                <option value="">Any neighborhood</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {status === 'error' && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting' || !email}
              className="w-full rounded-xl bg-sunset-orange-500 px-6 py-3.5 text-white font-bold text-base hover:bg-sunset-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sunset-orange-500/25"
            >
              {status === 'submitting' ? 'Subscribing\u2026' : 'Subscribe \u2014 it\u2019s free'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              No spam. Unsubscribe anytime. We&apos;ll only send you the good stuff.
            </p>
          </form>
        </div>
      </div>

      {/* What you'll get */}
      <div className="lg:col-span-2">
        <div className="bg-white/10 rounded-2xl p-8 text-white h-fit">
          <h2 className="text-lg font-bold mb-5">What you&apos;ll get</h2>
          <div className="space-y-5">
            {[
              { icon: '📅', title: 'Weekly Event Digest', desc: 'The best concerts, festivals, food events, and things to do in Houston — every week.' },
              { icon: '📍', title: 'Neighborhood Picks', desc: 'Events near you, filtered by the neighborhoods you care about.' },
              { icon: '📖', title: 'Local Blog Posts', desc: 'Neighborhood guides, seasonal round-ups, and hidden gems across HTX.' },
              { icon: '✅', title: 'Always free', desc: "No paywalls, no spam. Just Houston's best events in your inbox." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3.5">
                <div className="text-2xl leading-none mt-0.5">{icon}</div>
                <div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
