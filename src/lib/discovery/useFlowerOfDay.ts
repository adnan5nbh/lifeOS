"use client";

import { useEffect, useState } from "react";
import { FLOWER_LIST, FlowerInfo, dayOfYear } from "./data";
import { WikipediaSummary } from "./types";

interface FlowerOfDayState {
  flower: FlowerInfo | null;
  summary: WikipediaSummary | null;
  loading: boolean;
  error: string | null;
}

export function useFlowerOfDay() {
  const [state, setState] = useState<FlowerOfDayState>({
    flower: null,
    summary: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const flower = FLOWER_LIST[dayOfYear() % FLOWER_LIST.length];
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            flower.wikipediaTitle
          )}`
        );
        if (!res.ok) throw new Error("Couldn't load flower info");
        const data: WikipediaSummary = await res.json();
        if (!cancelled) {
          setState({ flower, summary: data, loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({ flower, summary: null, loading: false, error: "Couldn't load today's flower photo." });
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
