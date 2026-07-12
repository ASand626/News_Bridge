"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Globe, AlertCircle } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { PickedArticle, NewsSubcategory } from "@/types";

type Domain = "web3" | "finance";

const DOMAIN_TABS: { id: Domain; label: string; icon: string }[] = [
  { id: "web3",    label: "Web3", icon: "⛓️" },
  { id: "finance", label: "金融", icon: "💰" },
];

const FINANCE_SUBCAT_ORDER: NewsSubcategory[] = [
  "finance_stock", "finance_forex", "finance_bonds", "finance_macro", "finance_commodity",
];

function saveArticleLocal(a: PickedArticle) {
  try { localStorage.setItem(`nb_article_${a.id}`, JSON.stringify(a)); } catch {}
}

function ArticleCard({ pick }: { pick: PickedArticle }) {
  const title = pick.titleJa || pick.titleEn;
  return (
    <Link href={`/news/${pick.id}`}>
      <article className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          {pick.isEnglish && (
            <Globe size={12} className="shrink-0 mt-0.5 text-zinc-400" />
          )}
        </div>
        <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          {timeAgo(pick.publishedAt)}
        </p>
      </article>
    </Link>
  );
}

export function TodayPicks() {
  const [domain, setDomain] = useState<Domain>("web3");
  const [articles, setArticles] = useState<PickedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/news/picks?domain=${domain}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: PickedArticle[]) => {
        data.forEach(saveArticleLocal);
        setArticles(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [domain]);

  const bySubcat = articles.reduce<Record<string, PickedArticle>>((acc, a) => {
    if (a.subcategory && !acc[a.subcategory]) acc[a.subcategory] = a;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Flame size={18} className="text-orange-500" />
          今日のピックアップ
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {domain === "web3"
            ? "あたらしい経済｜前日・当日のニュース（1時間ごとに更新）"
            : "各カテゴリの注目ニュース・1時間ごとに更新"}
        </p>
      </div>

      {/* Domain tabs */}
      <div className="flex gap-2">
        {DOMAIN_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setDomain(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              domain === t.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="text-amber-800 dark:text-amber-300 font-medium">ニュースを取得できませんでした</p>
        </div>
      )}

      {loading ? (
        <PicksSkeleton domain={domain} />
      ) : !error && articles.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-4">ニュースが見つかりませんでした</p>
      ) : domain === "web3" ? (
        /* Web3: フラットリスト（あたらしい経済 全件） */
        <div className="space-y-2">
          {articles.map((pick) => <ArticleCard key={pick.id} pick={pick} />)}
        </div>
      ) : (
        /* 金融: サブカテゴリー別 */
        <div className="space-y-3">
          {FINANCE_SUBCAT_ORDER.map((subcatId) => {
            const pick = bySubcat[subcatId];
            if (!pick) return null;
            return (
              <div key={subcatId}>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
                  <span>{pick.subcategoryIcon}</span>
                  {pick.subcategoryLabel}
                </p>
                <ArticleCard pick={pick} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PicksSkeleton({ domain }: { domain: Domain }) {
  const count = domain === "web3" ? 8 : 5;
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
          <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1.5" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-2" />
        </div>
      ))}
    </div>
  );
}
