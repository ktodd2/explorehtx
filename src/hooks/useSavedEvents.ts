'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'explorehtx_saved_events';

/**
 * Hook for managing saved/favorited events using localStorage.
 * Handles hydration safely for SSR compatibility.
 */
export function useSavedEvents() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors (e.g., private browsing)
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever savedIds changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [savedIds, isHydrated]);

  const toggleSave = useCallback((eventId: string) => {
    setSavedIds((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter((id) => id !== eventId);
      }
      return [...prev, eventId];
    });
  }, []);

  const isSaved = useCallback(
    (eventId: string) => savedIds.includes(eventId),
    [savedIds]
  );

  const clearAll = useCallback(() => {
    setSavedIds([]);
  }, []);

  return {
    savedIds,
    toggleSave,
    isSaved,
    clearAll,
    count: savedIds.length,
    isHydrated,
  };
}
