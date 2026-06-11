import { CalendarEvent } from "./types";
import { timeToMinutes } from "./dateUtils";

export interface Occurrence {
  event: CalendarEvent;
  date: string; // YYYY-MM-DD this occurrence falls on
  start: number; // minutes from midnight
  end: number; // minutes from midnight
  done: boolean;
}

export function eventOccursOnDate(event: CalendarEvent, dateKey: string): boolean {
  if (!event.recurrence) return event.date === dateKey;
  if (dateKey < event.date) return false;
  if (event.recurrence.until && dateKey > event.recurrence.until) return false;

  if (event.recurrence.freq === "daily") return true;

  if (event.recurrence.freq === "weekly") {
    // Parse as local date to get the correct day of week.
    const [y, m, d] = dateKey.split("-").map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return event.recurrence.daysOfWeek?.includes(dow) ?? false;
  }

  return false;
}

function toOccurrence(event: CalendarEvent, dateKey: string): Occurrence {
  const start = timeToMinutes(event.startTime);
  let end = timeToMinutes(event.endTime);
  if (end <= start) end = start + 5; // guard against zero/negative duration

  return {
    event,
    date: dateKey,
    start,
    end,
    done: event.completedDates.includes(dateKey),
  };
}

/** All occurrences of all events that fall on the given date, sorted by start time. */
export function getOccurrencesForDate(events: CalendarEvent[], dateKey: string): Occurrence[] {
  return events
    .filter((e) => eventOccursOnDate(e, dateKey))
    .map((e) => toOccurrence(e, dateKey))
    .sort((a, b) => a.start - b.start);
}

/** Map of date -> occurrences for every date in the given list. */
export function getOccurrencesByDate(
  events: CalendarEvent[],
  dateKeys: string[]
): Record<string, Occurrence[]> {
  const result: Record<string, Occurrence[]> = {};
  for (const key of dateKeys) {
    result[key] = getOccurrencesForDate(events, key);
  }
  return result;
}
