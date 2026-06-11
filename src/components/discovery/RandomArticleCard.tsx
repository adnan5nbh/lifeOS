"use client";

import { useState } from "react";
import { useRandomArticle } from "@/lib/discovery/useRandomArticle";
import EmbedPanel from "./EmbedPanel";

export default function RandomArticleCard() {
  const { article, loading, error } = useRandomArticle();
  const [open, setOpen] = useState(false);
  const image = article?.thumbnail?.source;

  return (
    <div className="rounded-xl bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Random Learning
      </h2>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && error && <p className="text-sm text-slate-500">{error}</p>}

      {!loading && article && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={article.title}
              className="h-28 w-28 flex-shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="text-lg font-semibold text-slate-100">{article.title}</h3>
            <p className="line-clamp-4 text-sm text-slate-300">{article.extract}</p>
            <button
              onClick={() => setOpen(true)}
              className="mt-1 self-start text-sm font-medium text-indigo-400 hover:text-indigo-400"
            >
              Read more →
            </button>
          </div>
        </div>
      )}

      <EmbedPanel open={open} onClose={() => setOpen(false)} article={article} />
    </div>
  );
}
