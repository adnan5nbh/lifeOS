"use client";

import { useEffect, useState } from "react";
import { JournalEntry } from "./types";
import { createClient } from "@/lib/supabase/client";

type EntryRow = {
  id: string;
  date: string;
  content: string;
  ai_analysis: string | null;
  created_at: string;
  updated_at: string;
};

function rowToEntry(row: EntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    aiAnalysis: row.ai_analysis ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
        .from("journal_entries")
        .select("id, date, content, ai_analysis, created_at, updated_at")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!cancelled && data) {
        setEntries((data as EntryRow[]).map(rowToEntry));
      }
      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addEntry(date: string, content: string): Promise<JournalEntry | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, date, content })
      .select("id, date, content, ai_analysis, created_at, updated_at")
      .single();

    if (error || !data) return null;

    const entry = rowToEntry(data as EntryRow);
    setEntries((prev) => [entry, ...prev]);

    // Fire-and-forget: extract concepts into knowledge graph
    fetch("/api/graph/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, date }),
    }).catch(() => {});

    return entry;
  }

  async function updateEntry(id: string, date: string, content: string): Promise<void> {
    const now = new Date().toISOString();
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, date, content, updatedAt: now } : e)));
    await supabase.from("journal_entries").update({ date, content, updated_at: now }).eq("id", id);
  }

  async function deleteEntry(id: string): Promise<void> {
    const entry = entries.find((e) => e.id === id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("journal_entries").delete().eq("id", id);
    if (entry) {
      fetch("/api/graph/cleanup-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: entry.content }),
      }).catch(() => {});
    }
  }

  async function analyseEntry(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: entry.content, kind: "journal" }),
    });
    if (!res.ok) return;
    const { analysis } = await res.json();

    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, aiAnalysis: analysis } : e)));
    await supabase.from("journal_entries").update({ ai_analysis: analysis }).eq("id", id);
  }

  return { entries, loaded, addEntry, updateEntry, deleteEntry, analyseEntry };
}
