"use client";

import { useState } from "react";
import { AppliedAction } from "@/lib/assistant/applyActions";
import { AssistantAction } from "@/lib/claude/tools";

const ACTION_ICONS: Record<AssistantAction["type"], string> = {
  add_calendar_event: "📅",
  log_food: "🍽",
  log_exercise: "💪",
  add_journal_entry: "📓",
  add_quick_note: "📝",
  update_steps: "👟",
  delete_graph_node: "🗑️",
  clear_all_graph_nodes: "🗑️",
  edit_journal_entry: "✏️",
  delete_journal_entry: "🗑️",
};

export default function ActionSummaryPanel({
  message,
  actions,
  onDismiss,
  onRetry,
  onConfirm,
  onCancel,
}: {
  message: string | null;
  actions: AppliedAction[];
  onDismiss: () => void;
  onRetry: (index: number) => void;
  onConfirm: (index: number) => Promise<void>;
  onCancel: (index: number) => void;
}) {
  const [undone, setUndone] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState<Set<number>>(new Set());

  async function handleUndo(index: number) {
    const action = actions[index];
    if (!action.undo) return;
    await action.undo();
    setUndone((prev) => new Set(prev).add(index));
  }

  async function handleConfirm(index: number) {
    setConfirming((prev) => new Set(prev).add(index));
    try {
      await onConfirm(index);
    } finally {
      setConfirming((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
      {message && <p className="text-sm text-slate-300">{message}</p>}

      {actions.length > 0 && (
        <ul className="flex flex-col gap-1">
          {actions.map((applied, i) => (
            <li
              key={i}
              className="flex items-start justify-between gap-2 rounded-lg bg-slate-900 px-2 py-1.5 text-sm"
            >
              <span
                className={`flex-1 text-sm ${
                  undone.has(i)
                    ? "text-slate-500 line-through"
                    : applied.status === "pending"
                    ? "text-amber-200"
                    : "text-slate-200"
                }`}
              >
                {ACTION_ICONS[applied.action.type]} {applied.summary}
              </span>
              {applied.status === "pending" ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => onCancel(i)}
                    className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirm(i)}
                    disabled={confirming.has(i)}
                    className="rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                  >
                    {confirming.has(i) ? "…" : "Confirm"}
                  </button>
                </div>
              ) : applied.status === "failed" ? (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-rose-400">Failed</span>
                  <button
                    onClick={() => onRetry(i)}
                    className="rounded-lg px-2 py-1 text-xs text-indigo-300 hover:bg-slate-800"
                  >
                    Retry
                  </button>
                </div>
              ) : undone.has(i) ? (
                <span className="shrink-0 text-xs text-slate-500">Undone</span>
              ) : (
                applied.undo && (
                  <button
                    onClick={() => handleUndo(i)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-rose-300"
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
