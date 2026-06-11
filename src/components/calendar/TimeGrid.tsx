"use client";

import { Occurrence } from "@/lib/calendar/occurrences";
import { formatTimeLabel } from "@/lib/calendar/dateUtils";
import { GRID_HEIGHT, HOUR_HEIGHT, HOUR_LABEL_WIDTH } from "@/lib/calendar/grid";

export function HourLabels() {
  return (
    <div style={{ width: HOUR_LABEL_WIDTH, height: GRID_HEIGHT }} className="flex-shrink-0">
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={h}
          style={{ height: HOUR_HEIGHT }}
          className="relative -translate-y-2 pr-2 text-right text-[11px] text-slate-500"
        >
          {h === 0 ? "" : formatTimeLabel(h * 60)}
        </div>
      ))}
    </div>
  );
}

function EventBlock({
  occurrence,
  onDelete,
  onEdit,
}: {
  occurrence: Occurrence;
  onDelete: (id: string) => void;
  onEdit: (occurrence: Occurrence) => void;
}) {
  const { event } = occurrence;
  const top = (occurrence.start / 60) * HOUR_HEIGHT;
  const height = Math.max(((occurrence.end - occurrence.start) / 60) * HOUR_HEIGHT, 18);
  const isActivity = event.kind === "activity";

  return (
    <div
      style={{ top, height }}
      className={`group absolute left-0.5 right-0.5 overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-left text-[11px] shadow-sm ${
        isActivity
          ? "border-emerald-500 bg-emerald-900/60 text-emerald-200"
          : "border-indigo-500 bg-indigo-900/60 text-indigo-200"
      } ${occurrence.done ? "opacity-50 line-through" : ""}`}
    >
      <button
        type="button"
        className="block w-full text-left"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(occurrence);
        }}
      >
        <span className="font-medium">{event.title}</span>
        {height > 30 && (
          <span className="block text-[10px] opacity-75">
            {formatTimeLabel(occurrence.start)}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(event.id);
        }}
        className="absolute right-0.5 top-0.5 hidden rounded px-1 text-[10px] text-slate-400 hover:text-rose-400 group-hover:block"
        aria-label="Delete"
      >
        ✕
      </button>
    </div>
  );
}

export function DayColumn({
  occurrences,
  onDelete,
  onEdit,
  onSlotClick,
  isToday,
  nowMinutes,
}: {
  occurrences: Occurrence[];
  onDelete: (id: string) => void;
  onEdit: (occurrence: Occurrence) => void;
  onSlotClick?: (minutes: number) => void;
  isToday: boolean;
  nowMinutes: number;
}) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minutes = Math.round((offsetY / HOUR_HEIGHT) * 60);
    const snapped = Math.max(0, Math.min(1410, Math.round(minutes / 15) * 15));
    onSlotClick(snapped);
  }

  return (
    <div
      style={{ height: GRID_HEIGHT }}
      onClick={handleClick}
      className="relative flex-1 border-l border-slate-800"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <div
          key={h}
          style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          className="absolute left-0 right-0 border-t border-slate-800"
        />
      ))}
      {isToday && (
        <div
          style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
          className="absolute left-0 right-0 z-10 border-t-2 border-rose-400"
        >
          <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-400" />
        </div>
      )}
      {occurrences.map((occ) => (
        <EventBlock
          key={`${occ.event.id}-${occ.date}`}
          occurrence={occ}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
