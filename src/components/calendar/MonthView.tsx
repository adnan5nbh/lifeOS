"use client";

import { Occurrence } from "@/lib/calendar/occurrences";
import { dateKey, getMonthGrid, isSameDay } from "@/lib/calendar/dateUtils";

const MAX_VISIBLE = 3;

export default function MonthView({
  monthDate,
  occurrencesByDate,
  onDayClick,
  onEdit,
}: {
  monthDate: Date;
  occurrencesByDate: Record<string, Occurrence[]>;
  onDayClick: (date: Date) => void;
  onEdit: (occurrence: Occurrence) => void;
}) {
  const weeks = getMonthGrid(monthDate);
  const today = new Date();
  const month = monthDate.getMonth();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-950">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase text-slate-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flatMap((week) =>
          week.map((day) => {
            const key = dateKey(day);
            const occs = occurrencesByDate[key] ?? [];
            const inMonth = day.getMonth() === month;
            const isToday = isSameDay(day, today);

            return (
              <button
                key={key}
                onClick={() => onDayClick(day)}
                className={`flex min-h-[96px] flex-col items-stretch gap-1 border-b border-r border-slate-800 p-1.5 text-left transition hover:bg-slate-950 ${
                  inMonth ? "bg-slate-900" : "bg-slate-900/40"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-indigo-500 text-white"
                      : inMonth
                        ? "text-slate-200"
                        : "text-slate-600"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {occs.slice(0, MAX_VISIBLE).map((occ) => (
                    <span
                      key={`${occ.event.id}-${occ.date}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(occ);
                      }}
                      className={`truncate rounded px-1 py-0.5 text-left text-[10px] font-medium hover:underline ${
                        occ.event.kind === "activity"
                          ? "bg-emerald-900/60 text-emerald-300"
                          : "bg-indigo-900/60 text-indigo-300"
                      } ${occ.done ? "opacity-50 line-through" : ""}`}
                    >
                      {occ.event.title}
                    </span>
                  ))}
                  {occs.length > MAX_VISIBLE && (
                    <span className="px-1 text-[10px] text-slate-500">
                      +{occs.length - MAX_VISIBLE} more
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
