"use client";

import { useEffect, useRef } from "react";
import { Occurrence } from "@/lib/calendar/occurrences";
import { addDays, dateKey, formatWeekdayShort, isSameDay } from "@/lib/calendar/dateUtils";
import { HOUR_HEIGHT, HOUR_LABEL_WIDTH } from "@/lib/calendar/grid";
import { DayColumn, HourLabels } from "./TimeGrid";

export default function WeekView({
  weekStart,
  occurrencesByDate,
  nowMinutes,
  onDelete,
  onEdit,
  onSlotClick,
  onDayClick,
}: {
  weekStart: Date;
  occurrencesByDate: Record<string, Occurrence[]>;
  nowMinutes: number;
  onDelete: (id: string) => void;
  onEdit: (occurrence: Occurrence) => void;
  onSlotClick: (dateKey: string, minutes: number) => void;
  onDayClick: (date: Date) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, 7 * HOUR_HEIGHT - 40);
    }
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
      <div className="flex border-b border-slate-700">
        <div style={{ width: HOUR_LABEL_WIDTH }} className="flex-shrink-0" />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <button
              key={dateKey(day)}
              onClick={() => onDayClick(day)}
              className="flex flex-1 flex-col items-center gap-0.5 border-l border-slate-800 py-2 transition hover:bg-slate-950"
            >
              <span className="text-[11px] font-medium uppercase text-slate-500">
                {formatWeekdayShort(day)}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday ? "bg-indigo-500 text-white" : "text-slate-200"
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
        <div className="flex">
          <HourLabels />
          {days.map((day) => {
            const key = dateKey(day);
            return (
              <DayColumn
                key={key}
                occurrences={occurrencesByDate[key] ?? []}
                onDelete={onDelete}
                onEdit={onEdit}
                onSlotClick={(minutes) => onSlotClick(key, minutes)}
                isToday={isSameDay(day, today)}
                nowMinutes={nowMinutes}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
