"use client";

import { useWordOfDay } from "@/lib/discovery/useWordOfDay";

export default function WordOfDayCard() {
  const { word, entry, loading, error } = useWordOfDay();

  return (
    <div className="rounded-xl bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Word of the Day
      </h2>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && error && (
        <div>
          <p className="text-2xl font-semibold capitalize text-slate-100">{word}</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
        </div>
      )}

      {!loading && !error && entry && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold capitalize text-slate-100">
              {entry.word}
            </span>
            {(entry.phonetic || entry.phonetics.find((p) => p.text)?.text) && (
              <span className="text-sm text-indigo-400">
                {entry.phonetic ?? entry.phonetics.find((p) => p.text)?.text}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {entry.meanings.map((meaning, i) => (
              <div key={i}>
                <p className="text-sm italic text-slate-400">{meaning.partOfSpeech}</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-200">
                  {meaning.definitions.slice(0, 2).map((def, j) => (
                    <li key={j}>
                      {def.definition}
                      {def.example && (
                        <span className="block text-slate-500">
                          &ldquo;{def.example}&rdquo;
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
