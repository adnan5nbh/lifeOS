"use client";

import { useEffect, useState } from "react";
import { WikipediaSummary } from "./types";

interface RandomArticleState {
  article: WikipediaSummary | null;
  loading: boolean;
  error: string | null;
}

export function useRandomArticle() {
  const [state, setState] = useState<RandomArticleState>({
    article: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("https://en.wikipedia.org/api/rest_v1/page/random/summary");
        if (!res.ok) throw new Error("Couldn't load article");
        const data: WikipediaSummary = await res.json();
        if (!cancelled) {
          setState({ article: data, loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({ article: null, loading: false, error: "Couldn't load today's article." });
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
