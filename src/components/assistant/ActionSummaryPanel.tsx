"use client";

import { useState } from "react";
import { AppliedAction } from "@/lib/assistant/applyActions";

const ACTION_ICONS: Record<AppliedAction["action"]["type"], string> = {
  add_calendar_event: "📅",
  log_food: "🍽",
  log_exercise: "💪",
  add_journal_entry: "📓",
  add_quick_note: "📝",
  update_steps: "👟",
};

export default function ActionSummaryPanel({
  message,
  actions,
  onDismiss,
  onRetry,
}: {
  message: string | null;
  actions: AppliedAction[];
  onDismiss: () => void;
  onRetry: (index: number) => void;
}) {
  const [undone, setUndone] = useState<Set<number>>(new Set());

  async function handleUndo(index: number) {
    const action = actions[index];
    if (!action.undo) return;
    await action.undo();
    setUndone((prev) => new Set(prev).add(index));
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
      {message && <p className="text-sm text-slate-300">{message}</p>}

      {actions.length > 0 && (
        <ul className="flex flex-col gap-1">
          {actions.map((applied, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 px-2 py-1.5 text-sm"
            >
              <span className={undone.has(i) ? "text-slate-500 line-through" : "text-slate-200"}>
                {ACTION_ICONS[applied.action.type]} {applied.summary}
              </span>
              {applied.status === "failed" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400">Failed</span>
                  <button
                    onClick={() => onRetry(i)}
                    className="rounded-lg px-2 py-1 text-xs text-indigo-300 hover:bg-slate-800"
                  >
                    Retry
                  </button>
                </div>
              ) : undone.has(i) ? (
                <span className="text-xs text-slate-500">Undone</span>
              ) : (
                applied.undo && (
                  <button
                    onClick={() => handleUndo(i)}
                    className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-rose-300"
                  >
                    Undo
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onDismiss}
        className="self-end rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-slate-300"
      >
        Dismiss
      </button>
    </div>
  );
}
