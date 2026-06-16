"use client";

import { useEffect, useState } from "react";
import { ChatMessage } from "./types";
import { createClient } from "@/lib/supabase/client";

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .order("created_at", { ascending: true });

      if (!cancelled && data) {
        setMessages((data as MessageRow[]).map(rowToMessage));
      }
      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addLocalMessage(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  function updateLastMessage(content: string) {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], content };
      return next;
    });
  }

  function appendToLastMessage(suffix: string) {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + suffix };
      return next;
    });
  }

  return { messages, loaded, addLocalMessage, updateLastMessage, appendToLastMessage };
}
