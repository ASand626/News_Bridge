"use client";
import { useEffect, useState } from "react";
import { Plus, X, ExternalLink, Globe } from "lucide-react";
import { getSites, saveSites } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { FavoriteSite } from "@/types";

function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return null; }
}

export function FavoriteSites() {
  const [sites, setSites] = useState<FavoriteSite[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { getSites().then(setSites); }, []);

  function addSite() {
    if (!url.trim()) return;
    let resolved = url.trim();
    if (!/^https?:\/\//.test(resolved)) resolved = `https://${resolved}`;
    const id = crypto.randomUUID();
    const resolvedName = name.trim() || new URL(resolved).hostname.replace(/^www\./, "");
    const updated = [...sites, { id, name: resolvedName, url: resolved }];
    setSites(updated);
    saveSites(updated);
    setName(""); setUrl(""); setAdding(false);
  }

  function removeSite(id: string) {
    const updated = sites.filter((s) => s.id !== id);
    setSites(updated);
    saveSites(updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          お気に入りサイト
        </h2>
        <div className="flex items-center gap-2">
          {sites.length > 0 && (
            <button
              onClick={() => setEditMode((p) => !p)}
              className={cn("text-xs transition-colors", editMode ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300")}
            >
              {editMode ? "完了" : "編集"}
            </button>
          )}
          <button
            onClick={() => setAdding((p) => !p)}
            className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Plus size={13} /> 追加
          </button>
        </div>
      </div>

      {adding && (
        <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-3 space-y-2">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="サイト名（任意）"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSite()}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button onClick={addSite} disabled={!url.trim()}
              className="flex-1 rounded-lg bg-blue-600 text-white text-sm py-2 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              追加する
            </button>
            <button onClick={() => { setAdding(false); setName(""); setUrl(""); }}
              className="px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {sites.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 py-6 text-center">
          <Globe size={24} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">よく読むニュースサイトを登録しておくと便利です</p>
          <button onClick={() => setAdding(true)}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            + 最初のサイトを追加
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sites.map((site) => (
            <div key={site.id} className="relative group">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getFavicon(site.url) ?? ""} alt="" width={14} height={14}
                  className="rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                {site.name}
                <ExternalLink size={11} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {editMode && (
                <button
                  onClick={() => removeSite(site.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X size={9} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
