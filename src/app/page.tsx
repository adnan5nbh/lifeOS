"use client";

import { useEffect, useMemo, useState } from "react";
import { useEvents } from "@/lib/calendar/useEvents";
import {
  addDays,
  dateKey,
  formatFullDate,
  formatMonthYear,
  formatWeekRange,
  getMonthGrid,
  minutesToTime,
  startOfWeek,
  todayKey,
} from "@/lib/calendar/dateUtils";
import { Occurrence, getOccurrencesByDate, getOccurrencesForDate } from "@/lib/calendar/occurrences";
import { CalendarEvent } from "@/lib/calendar/types";
import CalendarHeader, { CalendarView } from "@/components/calendar/CalendarHeader";
import TodayView from "@/components/calendar/TodayView";
import DayView from "@/components/calendar/DayView";
import WeekView from "@/components/calendar/WeekView";
import MonthView from "@/components/calendar/MonthView";
import EventModal from "@/components/calendar/EventModal";
import ActivityModal from "@/components/calendar/ActivityModal";

function getNowMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export default function Home() {
  const { events, addEvent, updateEvent, deleteEvent, toggleOccurrenceDone, loaded } = useEvents();
  const [now, setNow] = useState<Date | null>(() => new Date());
  const [view, setView] = useState<CalendarView>("today");
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [eventDefaults, setEventDefaults] = useState({
    date: todayKey(),
    start: "09:00",
    end: "10:00",
  });
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const weekStart = useMemo(
    () => (selectedDate ? startOfWeek(selectedDate) : new Date()),
    [selectedDate]
  );

  const monthGridKeys = useMemo(() => {
    if (!selectedDate) return [];
    return getMonthGrid(selectedDate)
      .flat()
      .map((d) => dateKey(d));
  }, [selectedDate]);

  const weekKeys = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dateKey(addDays(weekStart, i))),
    [weekStart]
  );

  if (!loaded || !now || !selectedDate) {
    return (
      <main className="flex flex-1 items-center justify-center text-slate-500">
        Loading…
      </main>
    );
  }

  const nowMinutes = getNowMinutes(now);

  function openAddEvent(date: string, start = "09:00", end = "10:00") {
    setEditingEvent(null);
    setEventDefaults({ date, start, end });
    setModalKey((k) => k + 1);
    setEventModalOpen(true);
  }

  function openLogActivity() {
    setEditingEvent(null);
    setModalKey((k) => k + 1);
    setActivityModalOpen(true);
  }

  function openEditOccurrence(occurrence: Occurrence) {
    setEditingEvent(occurrence.event);
    setModalKey((k) => k + 1);
    if (occurrence.event.kind === "activity") {
      setActivityModalOpen(true);
    } else {
      setEventModalOpen(true);
    }
  }

  function handleSaveEvent(data: Omit<CalendarEvent, "id" | "completedDates">) {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      addEvent(data);
    }
  }

  function handlePrev() {
    if (!selectedDate) return;
    if (view === "day") setSelectedDate(addDays(selectedDate, -1));
    if (view === "week") setSelectedDate(addDays(selectedDate, -7));
    if (view === "month")
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  }

  function handleNext() {
    if (!selectedDate) return;
    if (view === "day") setSelectedDate(addDays(selectedDate, 1));
    if (view === "week") setSelectedDate(addDays(selectedDate, 7));
    if (view === "month")
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  }

  function handleToday() {
    setSelectedDate(new Date());
  }

  function goToDay(date: Date) {
    setSelectedDate(date);
    setView("day");
  }

  let label = "";
  if (view === "today") label = formatFullDate(now);
  if (view === "day") label = formatFullDate(selectedDate);
  if (view === "week") label = formatWeekRange(weekStart);
  if (view === "month") label = formatMonthYear(selectedDate);

  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-4xl flex-col gap-4 px-4 py-8">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          label={label}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onAddEvent={() =>
            openAddEvent(view === "today" ? todayKey() : dateKey(selectedDate))
          }
          onLogActivity={openLogActivity}
        />

        {view === "today" && (
          <TodayView
            occurrences={getOccurrencesForDate(events, todayKey())}
            nowMinutes={nowMinutes}
            onToggleDone={toggleOccurrenceDone}
            onDelete={deleteEvent}
            onEdit={openEditOccurrence}
          />
        )}

        {view === "day" && (
          <DayView
            date={selectedDate}
            occurrences={getOccurrencesForDate(events, dateKey(selectedDate))}
            nowMinutes={nowMinutes}
            onDelete={deleteEvent}
            onEdit={openEditOccurrence}
            onSlotClick={(minutes) =>
              openAddEvent(
                dateKey(selectedDate),
                minutesToTime(minutes),
                minutesToTime(minutes + 60)
              )
            }
          />
        )}

        {view === "week" && (
          <WeekView
            weekStart={weekStart}
            occurrencesByDate={getOccurrencesByDate(events, weekKeys)}
            nowMinutes={nowMinutes}
            onDelete={deleteEvent}
            onEdit={openEditOccurrence}
            onSlotClick={(date, minutes) =>
              openAddEvent(date, minutesToTime(minutes), minutesToTime(minutes + 60))
            }
            onDayClick={goToDay}
          />
        )}

        {view === "month" && (
          <MonthView
            monthDate={selectedDate}
            occurrencesByDate={getOccurrencesByDate(events, monthGridKeys)}
            onDayClick={goToDay}
            onEdit={openEditOccurrence}
          />
        )}
      </main>

      <EventModal
        key={`event-${modalKey}`}
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={deleteEvent}
        defaultDate={eventDefaults.date}
        defaultStartTime={eventDefaults.start}
        defaultEndTime={eventDefaults.end}
        editingEvent={editingEvent}
      />

      <ActivityModal
        key={`activity-${modalKey}`}
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={deleteEvent}
        defaultDate={todayKey()}
        editingEvent={editingEvent}
      />
    </div>
  );
}
