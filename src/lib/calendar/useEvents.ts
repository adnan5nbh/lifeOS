"use client";

import { useEffect, useState } from "react";
import { CalendarEvent } from "./types";

const STORAGE_KEY = "lifeos.calendar.events";

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved events once, on first render in the browser.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setEvents(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setLoaded(true);
  }, []);

  // Save whenever events change (after the initial load).
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, loaded]);

  function addEvent(event: Omit<CalendarEvent, "id" | "completedDates">) {
    setEvents((prev) => [
      ...prev,
      { ...event, id: crypto.randomUUID(), completedDates: [] },
    ]);
  }

  function updateEvent(id: string, updates: Omit<CalendarEvent, "id" | "completedDates">) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function toggleOccurrenceDone(id: string, dateKey: string) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const has = e.completedDates.includes(dateKey);
        return {
          ...e,
          completedDates: has
            ? e.completedDates.filter((d) => d !== dateKey)
            : [...e.completedDates, dateKey],
        };
      })
    );
  }

  return { events, addEvent, updateEvent, deleteEvent, toggleOccurrenceDone, loaded };
}
