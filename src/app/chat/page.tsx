"use client";

import { useRef, useState } from "react";
import { useChatHistory } from "@/lib/chat/useChatHistory";

export default function ChatPage() {
  const { messages, loaded, addLocalMessage, updateLastMessage } = useChatHistory();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const idCounter = useRef(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
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
        body: JSON.stringify({ message: text }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        updateLastMessage(assistantText);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Chat with Claude</h1>
          <p className="text-sm text-slate-400">
            Ask about your schedule, health trends, or journal — Claude has context on your LifeOS data.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-4">
          {!loaded && <p className="text-sm text-slate-500">Loading…</p>}
          {loaded && messages.length === 0 && (
            <p className="text-sm text-slate-500">Say hello to get started.</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "self-end bg-indigo-500/20 text-slate-100"
                  : "self-start bg-slate-800 text-slate-100"
              }`}
            >
              {m.content || (m.role === "assistant" ? "…" : "")}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-700 pt-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask Claude anything about your LifeOS data…"
            rows={2}
            className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
