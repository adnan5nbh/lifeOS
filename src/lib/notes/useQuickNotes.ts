"use client";

import { useEffect, useState } from "react";
import { QuickNote } from "./types";
import { createClient } from "@/lib/supabase/client";

type NoteRow = {
  id: string;
  content: string;
  ai_analysis: string | null;
  created_at: string;
};

function rowToNote(row: NoteRow): QuickNote {
  return {
    id: row.id,
    content: row.content,
    aiAnalysis: row.ai_analysis ?? undefined,
    createdAt: row.created_at,
  };
}

export function useQuickNotes() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
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
        .from("quick_notes")
        .select("id, content, ai_analysis, created_at")
        .order("created_at", { ascending: false });

      if (!cancelled && data) {
        setNotes((data as NoteRow[]).map(rowToNote));
      }
      if (!cancelled) setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addNote(content: string): Promise<QuickNote | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("quick_notes")
      .insert({ user_id: user.id, content })
      .select("id, content, ai_analysis, created_at")
      .single();

    if (error || !data) return null;

    const note = rowToNote(data as NoteRow);
    setNotes((prev) => [note, ...prev]);

    // Log as a scheduled activity so it appears on the Schedule page
    const now = new Date();
    const eventDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const startH = String(now.getHours()).padStart(2, "0");
    const startM = String(now.getMinutes()).padStart(2, "0");
    const endMin = now.getMinutes() + 15;
    const endH = String(now.getHours() + Math.floor(endMin / 60)).padStart(2, "0");
    const endM = String(endMin % 60).padStart(2, "0");
    void supabase.from("calendar_events").insert({
      user_id: user.id,
      title: "Quick Note",
      date: eventDate,
      start_time: `${startH}:${startM}`,
      end_time: `${endH}:${endM}`,
      kind: "activity",
      recurrence: null,
      completed_dates: [],
    });

    return note;
  }

  async function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("quick_notes").delete().eq("id", id);
  }

  async function analyseNote(id: string) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note.content, kind: "note" }),
    });
    if (!res.ok) return;
    const { analysis } = await res.json();

    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, aiAnalysis: analysis } : n)));
    await supabase.from("quick_notes").update({ ai_analysis: analysis }).eq("id", id);
  }

  return { notes, loaded, addNote, deleteNote, analyseNote };
}
