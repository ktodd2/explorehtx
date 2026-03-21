'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sun,
  Sunset,
  Moon,
  Plus,
  X,
  Pencil,
  Trash2,
  Calendar,
  Utensils,
  Ticket,
  MapPin,
  RotateCcw,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { usePlanner, type TimeSlot, type PlannerItem } from '@/hooks/usePlanner';

const SLOT_CONFIG: Record<TimeSlot, { label: string; icon: typeof Sun; time: string }> = {
  morning: { label: 'Morning', icon: Sun, time: '8am - 12pm' },
  afternoon: { label: 'Afternoon', icon: Sunset, time: '12pm - 5pm' },
  evening: { label: 'Evening', icon: Moon, time: '5pm - Late' },
};

const TYPE_ICONS: Record<string, typeof Calendar> = {
  event: Ticket,
  restaurant: Utensils,
  attraction: MapPin,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<PlannerItem, 'id'>) => void;
}

function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const [type, setType] = useState<'event' | 'restaurant' | 'attraction'>('event');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      type,
      entityId: '', // Manual entries don't have entity IDs
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Add to Plan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {(['event', 'restaurant', 'attraction'] as const).map((t) => {
              const Icon = TYPE_ICONS[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors ${
                    type === t
                      ? 'bg-sunset-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${type} name`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details (optional)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Location, time, notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sunset-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 disabled:bg-gray-200 text-white disabled:text-gray-400 font-semibold rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Or browse our{' '}
            <Link href="/events" className="text-sunset-orange-600 hover:underline">
              events
            </Link>
            ,{' '}
            <Link href="/restaurants" className="text-sunset-orange-600 hover:underline">
              restaurants
            </Link>
            , and{' '}
            <Link href="/things-to-do" className="text-sunset-orange-600 hover:underline">
              attractions
            </Link>{' '}
            to add items.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PlannerClient() {
  const {
    itinerary,
    isHydrated,
    addItem,
    removeItem,
    renamePlan,
    resetPlan,
    getTotalItems,
  } = usePlanner();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [addModal, setAddModal] = useState<{ dayIndex: number; slot: TimeSlot } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  if (!isHydrated || !itinerary) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 rounded-xl w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-100 rounded-2xl" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const handleSaveName = () => {
    if (newName.trim()) {
      renamePlan(newName.trim());
    }
    setEditingName(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Plan name */}
        <div className="flex items-center gap-3">
          {editingName ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-sunset-orange-500 focus:outline-none px-1"
              autoFocus
            />
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900">{itinerary.name}</h2>
              <button
                onClick={() => {
                  setNewName(itinerary.name);
                  setEditingName(true);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
          </span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (confirm('Reset your plan? This will clear all items.')) {
                resetPlan();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-houston-red hover:bg-red-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {itinerary.days.map((day, dayIndex) => (
          <div key={day.date} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Day header */}
            <div className="bg-gradient-to-r from-space-blue-900 to-space-blue-800 px-5 py-4">
              <h3 className="font-bold text-white text-lg">{formatDate(day.date)}</h3>
            </div>

            {/* Time slots */}
            <div className="divide-y divide-gray-100">
              {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map((slot) => {
                const config = SLOT_CONFIG[slot];
                const items = day[slot];

                return (
                  <div key={slot} className="p-4">
                    {/* Slot header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4 text-sunset-orange-500" />
                        <span className="font-medium text-gray-900">{config.label}</span>
                        <span className="text-xs text-gray-400">{config.time}</span>
                      </div>
                      <button
                        onClick={() => setAddModal({ dayIndex, slot })}
                        className="flex items-center gap-1 text-sm text-sunset-orange-600 hover:text-sunset-orange-700 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {/* Items */}
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((item) => {
                          const Icon = TYPE_ICONS[item.type];
                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-sunset-orange-100 text-sunset-orange-600 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {item.title}
                                </p>
                                {item.subtitle && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(dayIndex, slot, item.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-houston-red transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                        No plans yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-8 p-5 bg-space-blue-50 rounded-2xl">
        <h3 className="font-semibold text-space-blue-900 mb-2">Pro Tips</h3>
        <ul className="space-y-1 text-sm text-space-blue-700">
          <li>• Your plan is automatically saved to your browser</li>
          <li>• Click &quot;Add&quot; to add events, restaurants, or attractions</li>
          <li>• Browse our listings and look for the &quot;Add to Plan&quot; button</li>
        </ul>
      </div>

      {/* Add item modal */}
      {addModal && (
        <AddItemModal
          onClose={() => setAddModal(null)}
          onAdd={(item) => addItem(addModal.dayIndex, addModal.slot, item)}
        />
      )}
    </>
  );
}
