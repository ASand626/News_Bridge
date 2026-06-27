"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryBar } from "./CategoryBar";
import { NewsCard } from "./NewsCard";
import { NewsFeedSkeleton } from "./NewsFeed";
import { RefreshCw, AlertCircle } from "lucide-react";
import type { NewsArticle, NewsCategory } from "@/types";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(cat: NewsCategory) { return `nb_feed_${cat}`; }

function loadCache(cat: NewsCategory): NewsArticle[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(cat));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function saveCache(cat: NewsCategory, articles: NewsArticle[]) {
  try { localStorage.setItem(cacheKey(cat), JSON.stringify({ ts: Date.now(), data: articles })); } catch {}
}

function saveArticle(a: NewsArticle) {
  try { localStorage.setItem(`nb_article_${a.id}`, JSON.stringify(a)); } catch {}
}

export function NewsFeedClient() {
  const params = useSearchParams();
  const category = (params.get("category") ?? "ai") as NewsCategory;
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (cat: NewsCategory, bust = false) => {
    setLoading(true);
    setError(null);
    if (!bust) {
      const cached = loadCache(cat);
      if (cached) { setArticles(cached); setLoading(false); return; }
    }
    try {
      const res = await fetch(`/api/news/fetch?category=${cat}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsArticle[] = await res.json();
      data.forEach(saveArticle);
      saveCache(cat, data);
      setArticles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得エラー");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(category); }, [category, fetch_]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">今日のニュース</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">AIが初心者向けにわかりやすく解説します</p>
      </div>

      <CategoryBar />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-amber-800 dark:text-amber-300">
            <p className="font-medium">ニュースを取得できませんでした</p>
            <p className="text-xs mt-1 opacity-70">.env.local に NEWS_API_KEY または GNEWS_API_KEY を設定してください</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NewsFeedSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.map((a) => <NewsCard key={a.id} article={a} />)}
          </div>
          {articles.length > 0 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetch_(category, true)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <RefreshCw size={12} /> 更新
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
