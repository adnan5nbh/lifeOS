"use client";

import { useEffect, useRef } from "react";
import { Occurrence } from "@/lib/calendar/occurrences";
import { isSameDay } from "@/lib/calendar/dateUtils";
import { HOUR_HEIGHT } from "@/lib/calendar/grid";
import { DayColumn, HourLabels } from "./TimeGrid";

export default function DayView({
  date,
  occurrences,
  nowMinutes,
  onDelete,
  onEdit,
  onSlotClick,
}: {
  date: Date;
  occurrences: Occurrence[];
  nowMinutes: number;
  onDelete: (id: string) => void;
  onEdit: (occurrence: Occurrence) => void;
  onSlotClick: (minutes: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, 7 * HOUR_HEIGHT - 40);
    }
  }, []);

  const today = isSameDay(date, new Date());

  return (
    <div
      ref={scrollRef}
      className="max-h-[600px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-sm"
    >
      <div className="flex">
        <HourLabels />
        <DayColumn
          occurrences={occurrences}
          onDelete={onDelete}
          onEdit={onEdit}
          onSlotClick={onSlotClick}
          isToday={today}
          nowMinutes={nowMinutes}
        />
      </div>
    </div>
  );
}
