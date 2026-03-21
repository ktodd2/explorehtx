'use client';

import { useState, useEffect, useCallback } from 'react';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface PlannerItem {
  id: string;
  type: 'event' | 'restaurant' | 'attraction';
  entityId: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  startTime?: string;
  notes?: string;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  morning: PlannerItem[];
  afternoon: PlannerItem[];
  evening: PlannerItem[];
}

export interface Itinerary {
  id: string;
  name: string;
  days: DayPlan[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'explorehtx_planner';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getDefaultDays(): DayPlan[] {
  const today = new Date();
  const days: DayPlan[] = [];

  // Get the current or next weekend
  const dayOfWeek = today.getDay();
  let saturday = new Date(today);

  if (dayOfWeek === 0) {
    // Sunday - use today as the end
    saturday.setDate(today.getDate() - 1);
  } else if (dayOfWeek === 6) {
    // Saturday - use today
    saturday = today;
  } else {
    // Weekday - get next Saturday
    saturday.setDate(today.getDate() + (6 - dayOfWeek));
  }

  // Add Saturday and Sunday
  for (let i = 0; i < 2; i++) {
    const date = new Date(saturday);
    date.setDate(saturday.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0],
      morning: [],
      afternoon: [],
      evening: [],
    });
  }

  return days;
}

function createDefaultItinerary(): Itinerary {
  return {
    id: generateId(),
    name: 'My Weekend',
    days: getDefaultDays(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function usePlanner() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItinerary(JSON.parse(stored));
      } else {
        setItinerary(createDefaultItinerary());
      }
    } catch {
      setItinerary(createDefaultItinerary());
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when itinerary changes
  useEffect(() => {
    if (isHydrated && itinerary) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
    }
  }, [itinerary, isHydrated]);

  const addItem = useCallback(
    (dayIndex: number, slot: TimeSlot, item: Omit<PlannerItem, 'id'>) => {
      setItinerary((prev) => {
        if (!prev) return prev;

        const newDays = [...prev.days];
        const newItem: PlannerItem = { ...item, id: generateId() };
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          [slot]: [...newDays[dayIndex][slot], newItem],
        };

        return {
          ...prev,
          days: newDays,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const removeItem = useCallback(
    (dayIndex: number, slot: TimeSlot, itemId: string) => {
      setItinerary((prev) => {
        if (!prev) return prev;

        const newDays = [...prev.days];
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          [slot]: newDays[dayIndex][slot].filter((i) => i.id !== itemId),
        };

        return {
          ...prev,
          days: newDays,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const moveItem = useCallback(
    (
      fromDay: number,
      fromSlot: TimeSlot,
      toDay: number,
      toSlot: TimeSlot,
      itemId: string
    ) => {
      setItinerary((prev) => {
        if (!prev) return prev;

        const item = prev.days[fromDay][fromSlot].find((i) => i.id === itemId);
        if (!item) return prev;

        const newDays = [...prev.days];

        // Remove from source
        newDays[fromDay] = {
          ...newDays[fromDay],
          [fromSlot]: newDays[fromDay][fromSlot].filter((i) => i.id !== itemId),
        };

        // Add to destination
        newDays[toDay] = {
          ...newDays[toDay],
          [toSlot]: [...newDays[toDay][toSlot], item],
        };

        return {
          ...prev,
          days: newDays,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const updateItemNotes = useCallback(
    (dayIndex: number, slot: TimeSlot, itemId: string, notes: string) => {
      setItinerary((prev) => {
        if (!prev) return prev;

        const newDays = [...prev.days];
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          [slot]: newDays[dayIndex][slot].map((i) =>
            i.id === itemId ? { ...i, notes } : i
          ),
        };

        return {
          ...prev,
          days: newDays,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const renamePlan = useCallback((name: string) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      return { ...prev, name, updatedAt: new Date().toISOString() };
    });
  }, []);

  const resetPlan = useCallback(() => {
    const newItinerary = createDefaultItinerary();
    setItinerary(newItinerary);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItinerary));
  }, []);

  const getTotalItems = useCallback(() => {
    if (!itinerary) return 0;
    return itinerary.days.reduce(
      (acc, day) =>
        acc + day.morning.length + day.afternoon.length + day.evening.length,
      0
    );
  }, [itinerary]);

  return {
    itinerary,
    isHydrated,
    addItem,
    removeItem,
    moveItem,
    updateItemNotes,
    renamePlan,
    resetPlan,
    getTotalItems,
  };
}
