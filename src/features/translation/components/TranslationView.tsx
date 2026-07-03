"use client";
import { useEffect, useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { TermSelector } from "@/features/terms/components/TermSelector";
import { loadTranslation, saveTranslation } from "@/lib/storage";
import type { NewsArticle } from "@/types";

interface Props {
  article: NewsArticle;
}

export function TranslationView({ article }: Props) {
  const [titleJa, setTitleJa] = useState<string | null>(null);
  const [contentJa, setContentJa] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cached = await loadTranslation(article.id);
      if (cancelled) return;
      if (cached) {
        setTitleJa(cached.titleJa);
        setContentJa(cached.contentJa);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/translate/${article.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: article.titleEn, content: article.contentEn, url: article.url }),
        });
        if (!res.ok) throw new Error();
        const { titleJa: tJa, contentJa: cJa } = await res.json();
        if (cancelled) return;
        setTitleJa(tJa);
        setContentJa(cJa);
        saveTranslation(article.id, { titleJa: tJa, contentJa: cJa });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [article.id, article.titleEn, article.contentEn]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-zinc-400 dark:text-zinc-500">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">記事本文を取得して翻訳中... (初回のみ)</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 dark:text-red-400 py-4">翻訳に失敗しました。しばらく経ってから再試行してください。</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
        <Languages size={12} />
        テキストを選択して用語を調べられます
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* English original */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/10 p-4 space-y-3">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">🇺🇸 Original</span>
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug text-base">
            {article.titleEn}
          </h2>
          <TermSelector lang="en">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {article.contentEn || "(本文なし)"}
            </p>
          </TermSelector>
        </div>

        {/* Japanese translation */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">🇯🇵 日本語訳</span>
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug text-base">
            {titleJa}
          </h2>
          <TermSelector lang="ja">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {contentJa}
            </p>
          </TermSelector>
        </div>
      </div>
    </div>
  );
}
