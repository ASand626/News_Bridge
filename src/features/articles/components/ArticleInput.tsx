"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, FileText, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveArticle, addToHistory, hashUrl } from "@/lib/storage";

type Tab = "url" | "text";

export function ArticleInput() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUrl() {
    if (!url.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
      const id = await hashUrl(url.trim());
      const isJa = data.language === "ja";
      await saveArticle({
        id, externalId: id, source: "manual", category: null,
        titleJa: isJa ? data.title : "", titleEn: isJa ? "" : data.title,
        contentJa: isJa ? data.content : "", contentEn: isJa ? "" : data.content,
        description: data.content.slice(0, 200),
        url: url.trim(), imageUrl: data.imageUrl ?? null,
        isEnglish: !isJa, publishedAt: new Date().toISOString(),
      });
      await addToHistory({ id, title: data.title || url.trim(), url: url.trim(), savedAt: new Date().toISOString() });
      router.push(`/news/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得できませんでした");
      setLoading(false);
    }
  }

  async function handleText() {
    if (!text.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const id = await hashUrl(text.slice(0, 500));
      const isJa = /[ぁ-んァ-ン一-龯]/.test(text.slice(0, 500));
      const resolvedTitle = title.trim() || text.slice(0, 60) + (text.length > 60 ? "…" : "");
      await saveArticle({
        id, externalId: id, source: "manual", category: null,
        titleJa: isJa ? resolvedTitle : "", titleEn: isJa ? "" : resolvedTitle,
        contentJa: isJa ? text.trim() : "", contentEn: isJa ? "" : text.trim(),
        description: text.slice(0, 200),
        url: "", imageUrl: null,
        isEnglish: !isJa, publishedAt: new Date().toISOString(),
      });
      await addToHistory({ id, title: resolvedTitle, savedAt: new Date().toISOString() });
      router.push(`/news/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {([["url", Link2, "URLを貼り付け"], ["text", FileText, "本文を貼り付け"]] as const).map(([t, Icon, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              tab === t
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {tab === "url" ? (
          <>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrl()}
              placeholder="https://example.com/news/..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleUrl} disabled={!url.trim() || loading} className="w-full">
              {loading ? <><Loader2 size={15} className="animate-spin mr-2" /> 取得中...</> : <>解説する <ArrowRight size={15} className="ml-1.5" /></>}
            </Button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル（任意）"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="記事の本文を貼り付けてください..."
              rows={5}
              className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleText} disabled={!text.trim() || loading} className="w-full">
              {loading ? <><Loader2 size={15} className="animate-spin mr-2" /> 処理中...</> : <>解説する <ArrowRight size={15} className="ml-1.5" /></>}
            </Button>
          </>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>
    </div>
  );
}
