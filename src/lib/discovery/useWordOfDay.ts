"use client";

import { useEffect, useState } from "react";
import { WORD_LIST, dayOfYear } from "./data";
import { DictionaryEntry } from "./types";

interface WordOfDayState {
  word: string;
  entry: DictionaryEntry | null;
  loading: boolean;
  error: string | null;
}

export function useWordOfDay() {
  const [state, setState] = useState<WordOfDayState>({
    word: "",
    entry: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const word = WORD_LIST[dayOfYear() % WORD_LIST.length];
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );
        if (!res.ok) throw new Error("Word not found");
        const data: DictionaryEntry[] = await res.json();
        if (!cancelled) {
          setState({ word, entry: data[0], loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({ word, entry: null, loading: false, error: "Couldn't load this word right now." });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
