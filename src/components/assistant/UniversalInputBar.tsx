"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useEvents } from "@/lib/calendar/useEvents";
import { useHealthData } from "@/lib/health/useHealthData";
import { useQuickNotes } from "@/lib/notes/useQuickNotes";
import { useJournal } from "@/lib/notes/useJournal";
import { applyAction, AppliedAction, AssistantHooks } from "@/lib/assistant/applyActions";
import { todayKey } from "@/lib/health/utils";
import { scanBarcodeFromImage } from "@/lib/barcode/scanBarcode";
import ActionSummaryPanel from "./ActionSummaryPanel";
import VoiceInputButton from "./VoiceInputButton";
import AttachmentPicker, { ImageAttachment } from "./AttachmentPicker";

export default function UniversalInputBar() {
  const pathname = usePathname();
  const events = useEvents();
  const health = useHealthData();
  const notes = useQuickNotes();
  const journal = useJournal();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ message: string | null; actions: AppliedAction[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (pathname === "/login") return null;

  const hooks: AssistantHooks = { events, health, notes, journal };

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      let foodLookup = null;

      if (scanMode && attachment) {
        const barcode = await scanBarcodeFromImage(attachment.dataUrl);
        if (barcode) {
          const lookupRes = await fetch(`/api/food-lookup?barcode=${encodeURIComponent(barcode)}`);
          const lookupData = await lookupRes.json();
          if (lookupData.found) {
            foodLookup = lookupData;

            if (!trimmed) {
              const applied = await applyAction(
                {
                  type: "log_food",
                  name: lookupData.name,
                  calories: lookupData.calories ?? 0,
                  protein: lookupData.protein ?? 0,
                  carbs: lookupData.carbs,
                  fat: lookupData.fat,
                  servingSize: lookupData.servingSize,
                },
                hooks
              );
              setResult({ message: `Found "${lookupData.name}" via barcode scan.`, actions: [applied] });
              setText("");
              setAttachment(null);
              return;
            }
          }
        }
      }

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed || undefined,
          image: attachment ? { mimeType: attachment.mimeType, base64: attachment.base64 } : undefined,
          mode: scanMode ? "scan" : "chat",
          foodLookup,
          localDate: todayKey(),
        }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      const applied: AppliedAction[] = [];
      for (const action of data.actions ?? []) {
        applied.push(await applyAction(action, hooks));
      }

      setResult({ message: data.message ?? null, actions: applied });
      setText("");
      setAttachment(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function retryAction(index: number) {
    if (!result) return;
    const updated = [...result.actions];
    updated[index] = await applyAction(updated[index].action, hooks);
    setResult({ ...result, actions: updated });
  }

  async function confirmAction(index: number) {
    if (!result) return;
    const action = result.actions[index];
    if (!action.confirm) return;
    const confirmed = await action.confirm();
    const updated = [...result.actions];
    updated[index] = confirmed;
    setResult({ ...result, actions: updated });
  }

  function cancelAction(index: number) {
    if (!result) return;
    setResult({ ...result, actions: result.actions.filter((_, i) => i !== index) });
  }

  return (
    <div className="fixed bottom-20 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-5">
      {open && (
        <div className="flex w-[calc(100vw-2.5rem)] max-w-md flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Ask LifeOS</h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="e.g. 'Add a dentist appointment tomorrow at 2pm' or 'I had a chicken salad for lunch, 450 kcal'"
            rows={3}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
          />

          {attachment && (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.dataUrl} alt="Attachment preview" className="max-h-32 rounded-lg border border-slate-700" />
              <button
                onClick={() => setAttachment(null)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-300 hover:bg-rose-500/80"
                aria-label="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <VoiceInputButton onTranscript={(transcript) => setText(transcript)} />
              <AttachmentPicker onAttach={setAttachment} />
              <button
                type="button"
                onClick={() => setScanMode((prev) => !prev)}
                title="Scan barcode mode"
                className={`rounded-lg px-2 py-2 text-lg transition ${
                  scanMode ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                🔍
              </button>
            </div>
            <button
              onClick={submit}
              disabled={submitting || (!text.trim() && !attachment)}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {submitting ? "Thinking…" : "Send"}
            </button>
          </div>

          {scanMode && (
            <p className="text-xs text-slate-500">
              Scan barcode mode: attach a photo of a barcode to look up nutrition info via Open Food Facts.
            </p>
          )}

          {result && (
            <ActionSummaryPanel
              message={result.message}
              actions={result.actions}
              onDismiss={() => setResult(null)}
              onRetry={retryAction}
              onConfirm={confirmAction}
              onCancel={cancelAction}
            />
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-2xl text-white shadow-xl transition hover:bg-indigo-400"
        aria-label="Open assistant"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
