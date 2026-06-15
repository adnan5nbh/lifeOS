"use client";

import { useEffect, useState } from "react";
import { CalendarEvent } from "./types";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "lifeos.calendar.events";
const MIGRATED_KEY = "lifeos.calendar.migrated";

type EventRow = {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  kind: CalendarEvent["kind"];
  recurrence: CalendarEvent["recurrence"] | null;
  completed_dates: string[];
};

function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    kind: row.kind,
    recurrence: row.recurrence ?? undefined,
    completedDates: row.completed_dates ?? [],
  };
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // One-time migration of any locally-stored events into Supabase.
      if (!localStorage.getItem(MIGRATED_KEY)) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const localEvents: CalendarEvent[] = JSON.parse(raw);
            if (localEvents.length > 0) {
              await supabase.from("calendar_events").insert(
                localEvents.map((e) => ({
                  user_id: user.id,
                  title: e.title,
                  date: e.date,
                  start_time: e.startTime,
                  end_time: e.endTime,
                  kind: e.kind,
                  recurrence: e.recurrence ?? null,
                  completed_dates: e.completedDates,
                }))
              );
            }
          }
        } catch {
          // ignore corrupted local storage
        }
        localStorage.setItem(MIGRATED_KEY, "1");
        localStorage.removeItem(STORAGE_KEY);
      }

      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .order("date", { ascending: true });

      if (!cancelled && data) {
        setEvents((data as EventRow[]).map(rowToEvent));
      }
      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addEvent(event: Omit<CalendarEvent, "id" | "completedDates">) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: user.id,
        title: event.title,
        date: event.date,
        start_time: event.startTime,
        end_time: event.endTime,
        kind: event.kind,
        recurrence: event.recurrence ?? null,
        completed_dates: [],
      })
      .select()
      .single();

    if (!error && data) {
      setEvents((prev) => [...prev, rowToEvent(data as EventRow)]);
    }
  }

  async function updateEvent(id: string, updates: Omit<CalendarEvent, "id" | "completedDates">) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    await supabase
      .from("calendar_events")
      .update({
        title: updates.title,
        date: updates.date,
        start_time: updates.startTime,
        end_time: updates.endTime,
        kind: updates.kind,
        recurrence: updates.recurrence ?? null,
      })
      .eq("id", id);
  }

  async function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("calendar_events").delete().eq("id", id);
  }

  async function toggleOccurrenceDone(id: string, dateKey: string) {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    const has = event.completedDates.includes(dateKey);
    const completedDates = has
      ? event.completedDates.filter((d) => d !== dateKey)
      : [...event.completedDates, dateKey];

    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completedDates } : e))
    );

    await supabase
      .from("calendar_events")
      .update({ completed_dates: completedDates })
      .eq("id", id);
  }

  return { events, addEvent, updateEvent, deleteEvent, toggleOccurrenceDone, loaded };
}
