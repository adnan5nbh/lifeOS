"use client";

import Modal from "@/components/Modal";
import { WikipediaSummary } from "@/lib/discovery/types";

export default function EmbedPanel({
  open,
  onClose,
  article,
}: {
  open: boolean;
  onClose: () => void;
  article: WikipediaSummary | null;
}) {
  if (!article) return null;

  const image = article.originalimage?.source ?? article.thumbnail?.source;

  return (
    <Modal open={open} onClose={onClose} title={article.title} maxWidthClass="max-w-2xl">
      <div className="flex flex-col gap-3">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={article.title} className="max-h-80 w-full rounded-lg object-cover" />
        )}

        {article.description && (
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {article.description}
          </p>
        )}

        <p className="text-sm leading-relaxed text-slate-200">{article.extract}</p>

        <a
          href={article.content_urls.desktop.page}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm font-medium text-indigo-400 hover:text-indigo-400"
        >
          Read full article on Wikipedia →
        </a>
      </div>
    </Modal>
  );
}
