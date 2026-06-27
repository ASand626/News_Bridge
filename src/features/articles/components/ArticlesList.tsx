"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Trash2, ExternalLink } from "lucide-react";
import { getHistory, removeFromHistory } from "@/lib/storage";
import { timeAgo } from "@/lib/utils";
import type { ArticleHistoryItem } from "@/types";

export function ArticlesList() {
  const [items, setItems] = useState<ArticleHistoryItem[]>([]);

  useEffect(() => { getHistory().then(setItems); }, []);

  function remove(id: string) {
    removeFromHistory(id);
    setItems((p) => p.filter((h) => h.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-1">
        解説した記事
      </h2>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <Link href={`/news/${item.id}`} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock size={10} className="text-zinc-400" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{timeAgo(item.savedAt)}</span>
                {item.url && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[140px]">
                      {new URL(item.url).hostname.replace(/^www\./, "")}
                    </span>
                  </>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                  <ExternalLink size={13} />
                </a>
              )}
              <button onClick={() => remove(item.id)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
