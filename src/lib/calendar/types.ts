export type EventKind = "event" | "activity";

export type RecurrenceFreq = "daily" | "weekly";

export interface Recurrence {
  freq: RecurrenceFreq;
  /** 0 = Sunday .. 6 = Saturday. Only used when freq is "weekly". */
  daysOfWeek?: number[];
  /** Inclusive end date (YYYY-MM-DD). Omit for "repeats forever". */
  until?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  /** Anchor date (YYYY-MM-DD) — the occurrence date for one-off events,
   *  or the date recurrence starts from. */
  date: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  kind: EventKind;
  recurrence?: Recurrence;
  /** Dates (YYYY-MM-DD) on which this event/occurrence was marked done. */
  completedDates: string[];
}
