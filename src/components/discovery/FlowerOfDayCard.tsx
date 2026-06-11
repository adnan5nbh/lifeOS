"use client";

import { useFlowerOfDay } from "@/lib/discovery/useFlowerOfDay";

export default function FlowerOfDayCard() {
  const { flower, summary, loading, error } = useFlowerOfDay();
  const image = summary?.originalimage?.source ?? summary?.thumbnail?.source;

  return (
    <div className="overflow-hidden rounded-xl bg-slate-900 shadow-sm">
      <h2 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Flower of the Day
      </h2>

      {loading && <p className="px-5 py-4 text-sm text-slate-500">Loading…</p>}

      {!loading && flower && (
        <div className="flex flex-col">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={flower.name}
              className="mt-3 h-56 w-full object-cover"
            />
          )}

          <div className="flex flex-col gap-2 p-5">
            <h3 className="text-xl font-semibold text-slate-100">{flower.name}</h3>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Meaning
              </p>
              <p className="text-sm text-slate-200">{flower.meaning}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fun fact
              </p>
              <p className="text-sm text-slate-200">{flower.funFact}</p>
            </div>

            {error && <p className="text-xs text-slate-500">{error}</p>}

            {summary?.content_urls?.desktop?.page && (
              <a
                href={summary.content_urls.desktop.page}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 self-start text-sm font-medium text-indigo-400 hover:text-indigo-400"
              >
                Learn more on Wikipedia →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
