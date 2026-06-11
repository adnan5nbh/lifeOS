"use client";

import { useEffect, useState } from "react";
import { HNItem } from "./types";

interface HNState {
  stories: HNItem[];
  loading: boolean;
  error: string | null;
}

export function useHackerNews(count = 5) {
  const [state, setState] = useState<HNState>({ stories: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
        if (!idsRes.ok) throw new Error("Couldn't load Hacker News");
        const ids: number[] = await idsRes.json();

        const stories = await Promise.all(
          ids.slice(0, count).map(async (id) => {
            const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return (await res.json()) as HNItem;
          })
        );

        if (!cancelled) {
          setState({ stories, loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({ stories: [], loading: false, error: "Couldn't load Hacker News stories." });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [count]);

  return state;
}
