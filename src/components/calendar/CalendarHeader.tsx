"use client";

export type CalendarView = "today" | "day" | "week" | "month";

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export default function CalendarHeader({
  view,
  onViewChange,
  label,
  onPrev,
  onNext,
  onToday,
  onAddEvent,
  onLogActivity,
}: {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
  onLogActivity: () => void;
}) {
  const showNav = view !== "today";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100">Calendar</h1>
          {showNav && (
            <div className="flex items-center gap-1">
              <button
                onClick={onPrev}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800"
                aria-label="Previous"
              >
                ←
              </button>
              <button
                onClick={onNext}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800"
                aria-label="Next"
              >
                →
              </button>
              <button
                onClick={onToday}
                className="rounded-lg border border-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Today
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLogActivity}
            className="rounded-lg border border-emerald-800 bg-emerald-950 px-3 py-1.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-900/60"
          >
            + Log activity
          </button>
          <button
            onClick={onAddEvent}
            className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            + Add event
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => onViewChange(v.key)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                view === v.key
                  ? "bg-slate-900 text-indigo-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
