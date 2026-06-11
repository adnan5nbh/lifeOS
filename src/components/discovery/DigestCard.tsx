"use client";

import { useHackerNews } from "@/lib/discovery/useHackerNews";

export default function DigestCard() {
  const { stories, loading, error } = useHackerNews(5);

  return (
    <div className="rounded-xl bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Tech &amp; Finance Digest
      </h2>

      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">TLDR Newsletter</p>
            <a
              href="https://tldr.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-400"
            >
              Open ↗
            </a>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-700">
            <iframe
              src="https://tldr.tech"
              title="TLDR Newsletter"
              className="h-64 w-full"
              loading="lazy"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            If the preview appears blank, TLDR may block embedding — use the
            &quot;Open&quot; link instead.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">Top Hacker News Stories</p>
          {loading && <p className="text-sm text-slate-500">Loading…</p>}
          {!loading && error && <p className="text-sm text-slate-500">{error}</p>}
          {!loading && !error && (
            <ul className="flex flex-col gap-2">
              {stories.map((story) => (
                <li key={story.id}>
                  <a
                    href={story.url ?? `https://news.ycombinator.com/item?id=${story.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slate-200 hover:text-indigo-400"
                  >
                    {story.title}
                  </a>
                  <span className="ml-2 text-xs text-slate-500">{story.score} pts</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">Markets</p>
          <a
            href="https://finance.yahoo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-indigo-400 hover:text-indigo-400"
          >
            Open Yahoo Finance ↗
          </a>
        </div>
      </div>
    </div>
  );
}
