"use client";

import { useState } from "react";
import { CalendarEvent, RecurrenceFreq } from "@/lib/calendar/types";
import { parseDateKey } from "@/lib/calendar/dateUtils";
import Modal from "@/components/Modal";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function EventModal({
  open,
  onClose,
  onSave,
  onDelete,
  defaultDate,
  defaultStartTime = "09:00",
  defaultEndTime = "10:00",
  editingEvent,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id" | "completedDates">) => void;
  onDelete?: (id: string) => void;
  defaultDate: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  editingEvent?: CalendarEvent | null;
}) {
  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [date, setDate] = useState(editingEvent?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(editingEvent?.startTime ?? defaultStartTime);
  const [endTime, setEndTime] = useState(editingEvent?.endTime ?? defaultEndTime);
  const [repeat, setRepeat] = useState<"none" | RecurrenceFreq>(
    editingEvent?.recurrence?.freq ?? "none"
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    () => editingEvent?.recurrence?.daysOfWeek ?? [parseDateKey(defaultDate).getDay()]
  );
  const [until, setUntil] = useState(editingEvent?.recurrence?.until ?? "");

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      date,
      startTime,
      endTime,
      kind: "event",
      recurrence:
        repeat === "none"
          ? undefined
          : {
              freq: repeat,
              daysOfWeek: repeat === "weekly" ? daysOfWeek : undefined,
              until: until || undefined,
            },
    });

    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editingEvent ? "Edit event" : "Add event"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Title
          <input
            type="text"
            autoFocus
            placeholder="e.g. Gym"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
            Start
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
            End
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Repeat
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as "none" | RecurrenceFreq)}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>

        {repeat === "weekly" && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">On these days</span>
            <div className="flex gap-1">
              {DAY_LABELS.map((label, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
                    daysOfWeek.includes(i)
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {repeat !== "none" && (
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Repeat until (optional)
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </label>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="submit"
            className="self-start rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            {editingEvent ? "Save changes" : "Save event"}
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
