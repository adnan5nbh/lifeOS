"use client";

import { Occurrence } from "@/lib/calendar/occurrences";
import { formatTimeLabel } from "@/lib/calendar/dateUtils";

function formatRange(start: number, end: number): string {
  return `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`;
}

export default function TodayView({
  occurrences,
  nowMinutes,
  onToggleDone,
  onDelete,
  onEdit,
}: {
  occurrences: Occurrence[];
  nowMinutes: number;
  onToggleDone: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onEdit: (occurrence: Occurrence) => void;
}) {
  if (occurrences.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 p-8 text-center text-slate-400">
        Nothing planned or logged for today yet.
      </div>
    );
  }

  const nowMarkerIndex = occurrences.findIndex((o) => o.start >= nowMinutes);

  return (
    <ol className="flex flex-col gap-3">
      {occurrences.map((occ, i) => {
        const { event } = occ;
        const isActivity = event.kind === "activity";
        const isRecurring = !!event.recurrence;

        return (
          <li key={`${event.id}-${occ.date}`}>
            {i === nowMarkerIndex && (
              <div className="my-2 flex items-center gap-2 text-xs font-medium text-indigo-400">
                <span className="h-px flex-1 bg-indigo-300" />
                Now · {formatTimeLabel(nowMinutes)}
                <span className="h-px flex-1 bg-indigo-300" />
              </div>
            )}
            <div
              className={`flex items-start gap-3 rounded-xl border-l-4 p-3 shadow-sm transition ${
                isActivity
                  ? "border-emerald-400 bg-emerald-950"
                  : "border-indigo-400 bg-indigo-950"
              } ${occ.done ? "opacity-50" : ""}`}
            >
              {isActivity ? (
                <span className="mt-1 text-emerald-400" aria-label="Logged">
                  ✓
                </span>
              ) : (
                <input
                  type="checkbox"
                  checked={occ.done}
                  onChange={() => onToggleDone(event.id, occ.date)}
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-mono text-slate-400">
                    {formatRange(occ.start, occ.end)}
                  </span>
                  {isRecurring && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 shadow-sm">
                      Repeats
                    </span>
                  )}
                  {isActivity && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 shadow-sm">
                      Logged
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(occ)}
                  className={`mt-1 text-left font-medium text-slate-100 hover:underline ${
                    occ.done ? "line-through" : ""
                  }`}
                >
                  {event.title}
                </button>
              </div>
              <button
                onClick={() => onDelete(event.id)}
                className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-900 hover:text-rose-400"
                aria-label="Delete"
              >
                ✕
              </button>
            </div>
          </li>
        );
      })}
      {nowMarkerIndex === -1 && (
        <li className="my-2 flex items-center gap-2 text-xs font-medium text-indigo-400">
          <span className="h-px flex-1 bg-indigo-300" />
          Now · {formatTimeLabel(nowMinutes)}
          <span className="h-px flex-1 bg-indigo-300" />
        </li>
      )}
    </ol>
  );
}
