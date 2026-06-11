"use client";

import { useState } from "react";
import { CalendarEvent } from "@/lib/calendar/types";
import Modal from "@/components/Modal";

export default function ActivityModal({
  open,
  onClose,
  onSave,
  onDelete,
  defaultDate,
  editingEvent,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id" | "completedDates">) => void;
  onDelete?: (id: string) => void;
  defaultDate: string;
  editingEvent?: CalendarEvent | null;
}) {
  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [date, setDate] = useState(editingEvent?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(editingEvent?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(editingEvent?.endTime ?? "09:15");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      date,
      startTime,
      endTime,
      kind: "activity",
    });

    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editingEvent ? "Edit activity" : "Log an activity"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-xs text-slate-400">
          Quickly record something you just did — it&apos;ll show up on your
          calendar and in today&apos;s timeline.
        </p>

        <label className="flex flex-col gap-1 text-sm text-slate-300">
          What did you do?
          <input
            type="text"
            autoFocus
            placeholder="e.g. Read a book"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
            Start
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
            End
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="submit"
            className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            {editingEvent ? "Save changes" : "Log it"}
          </button>
          {editingEvent && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(editingEvent.id);
                onClose();
              }}
              className="self-start rounded-lg px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-950"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
