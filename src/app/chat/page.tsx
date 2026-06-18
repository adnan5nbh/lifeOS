"use client";

import { useEffect, useRef, useState } from "react";
import { useChatHistory } from "@/lib/chat/useChatHistory";
import { useEvents } from "@/lib/calendar/useEvents";
import { useHealthData } from "@/lib/health/useHealthData";
import { useQuickNotes } from "@/lib/notes/useQuickNotes";
import { useJournal } from "@/lib/notes/useJournal";
import { applyAction, AssistantHooks } from "@/lib/assistant/applyActions";
import { AssistantAction } from "@/lib/claude/tools";
import { todayKey } from "@/lib/health/utils";
import VoiceInputButton from "@/components/assistant/VoiceInputButton";
import AttachmentPicker, { ImageAttachment } from "@/components/assistant/AttachmentPicker";
import { scanBarcodeFromImage } from "@/lib/barcode/scanBarcode";

const ACTIONS_MARKER = "\n\n[[LIFEOS_TOOL_CALLS]]\n";

export default function ChatPage() {
  const { messages, loaded, addLocalMessage, updateLastMessage, appendToLastMessage } = useChatHistory();
  const events = useEvents();
  const health = useHealthData();
  const notes = useQuickNotes();
  const journal = useJournal();
  const hooks: AssistantHooks = { events, health, notes, journal };

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [processingActions, setProcessingActions] = useState(false);
  const [pendingImage, setPendingImage] = useState<ImageAttachment | null>(null);
  const idCounter = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function applyActionsSequentially(actions: AssistantAction[]) {
    setProcessingActions(true);
    try {
      for (let i = 0; i < actions.length; i++) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 300));
        }

        let result = await applyAction(actions[i], hooks);

        // Auto-confirm destructive actions — Claude already got verbal consent in the conversation
        if (result.status === "pending" && result.confirm) {
          result = await result.confirm();
        }

        const icon = result.status === "applied" ? "✅" : "❌";
        appendToLastMessage(`\n${icon} ${result.summary}`);
      }
    } finally {
      setProcessingActions(false);
    }
  }

  async function handleAttach(attachment: ImageAttachment) {
    setPendingImage(attachment);
    const barcode = await scanBarcodeFromImage(attachment.dataUrl);
    if (barcode) {
      try {
        const res = await fetch(`/api/food-lookup?barcode=${encodeURIComponent(barcode)}`);
        const data = await res.json();
        if (data.found) {
          const perLabel = data.per === "serving" ? "per serving" : "per 100g";
          const info = `Scanned barcode for ${data.name}${data.brand ? ` (${data.brand})` : ""}${data.servingSize ? ` — ${data.servingSize}` : ""}: ${data.calories ?? "?"}kcal, ${data.protein ?? "?"}g protein, ${data.carbs ?? "?"}g carbs, ${data.fat ?? "?"}g fat ${perLabel}. Please log this food for today.`;
          setInput(info);
          setTimeout(() => {
            const el = textareaRef.current;
            if (el) {
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
            }
          }, 0);
        }
      } catch {
        // Food lookup failed — keep image for manual description
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || processingActions) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    const imageToSend = pendingImage;
    setPendingImage(null);
    setSending(true);

    addLocalMessage({
      id: `local-${idCounter.current++}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    });
    addLocalMessage({
      id: `local-${idCounter.current++}`,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          localDate: todayKey(),
          image: imageToSend ? { mimeType: imageToSend.mimeType, base64: imageToSend.base64 } : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        updateLastMessage("Something went wrong. Please try again.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        rawText += decoder.decode(value, { stream: true });

        // During streaming, show only the text portion (hide action marker if it arrives)
        const markerIdx = rawText.indexOf(ACTIONS_MARKER);
        updateLastMessage(markerIdx !== -1 ? rawText.slice(0, markerIdx) : rawText);
      }

      // After stream completes, parse and apply any tool actions
      const markerIdx = rawText.indexOf(ACTIONS_MARKER);
      if (markerIdx !== -1) {
        const displayText = rawText.slice(0, markerIdx);
        updateLastMessage(displayText);

        try {
          const actions: AssistantAction[] = JSON.parse(rawText.slice(markerIdx + ACTIONS_MARKER.length));
          if (actions.length > 0) {
            await applyActionsSequentially(actions);
          }
        } catch {
          // Malformed action JSON — ignore
        }
      }
    } catch {
      updateLastMessage("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const isLoading = sending || processingActions;

  return (
    <div className="flex flex-col bg-slate-950 h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-3.5rem)]">
      {/* Messages area */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {!loaded && <p className="text-sm text-slate-500">Loading…</p>}
        {loaded && messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-3xl">💬</p>
            <p className="text-sm font-semibold text-slate-200">Chat with your AI assistant</p>
            <p className="max-w-xs text-xs text-slate-500">
              Ask anything — analyse mood patterns, log food, add calendar events, or just have a conversation.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-indigo-500 text-white"
                : "mr-auto bg-slate-800 text-slate-100"
            }`}
          >
            {m.content || (m.role === "assistant" ? <span className="italic text-slate-500">…</span> : "")}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-700 bg-slate-900 px-3 py-2.5">
        {pendingImage && (
          <div className="mb-2">
            <div className="relative inline-block">
              <img
                src={pendingImage.dataUrl}
                alt="Attachment"
                className="h-16 w-16 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-[10px] leading-none text-white hover:bg-slate-500"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex shrink-0 items-end gap-0.5">
            <VoiceInputButton onTranscript={(t) => setInput(t)} />
            <AttachmentPicker onAttach={handleAttach} />
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
            }}
            placeholder="Message… (Shift+Enter to send)"
            rows={1}
            style={{ resize: "none" }}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:opacity-50"
            aria-label="Send"
          >
            {isLoading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.114A28.897 28.897 0 003.105 2.288z" />
              </svg>
            )}
          </button>
        </form>
        <p className="mt-1 text-center text-[10px] text-slate-600">Shift+Enter to send · Enter for new line</p>
      </div>
    </div>
  );
}
