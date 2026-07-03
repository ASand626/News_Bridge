"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Globe, Languages } from "lucide-react";
import { ExplanationShell } from "@/features/explanation/components/ExplanationShell";
import { TranslationView } from "@/features/translation/components/TranslationView";
import { BookmarkButton } from "@/features/bookmarks/components/BookmarkButton";
import { Badge } from "@/components/ui/badge";
import { loadArticle, addToHistory } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types";

const CAT_LABELS: Record<string, string> = {
  ai: "🤖 AI", web3: "⛓️ Web3", finance: "💰 金融", economy: "📊 経済", tech: "💻 テック",
};

type Tab = "explanation" | "translation";

export function ArticleDetailClient({ id }: { id: string }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("explanation");

  useEffect(() => {
    loadArticle(id).then((a) => {
      if (a) {
        setArticle(a);
        addToHistory({ id, title: a.titleJa || a.titleEn, url: a.url || undefined, savedAt: new Date().toISOString() });
      } else {
        setNotFound(true);
      }
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-zinc-500 dark:text-zinc-400">記事が見つかりませんでした</p>
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← トップに戻る
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-6 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
    );
  }

  const title = article.titleJa || article.titleEn;
  const content = article.contentJa || article.contentEn;

  return (
    <div className="space-y-5">
      {/* Back + meta */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft size={16} /> 戻る
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <BookmarkButton article={article} />
          {article.category && (
            <Badge variant="secondary">{CAT_LABELS[article.category]}</Badge>
          )}
          {article.isEnglish && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe size={10} /> EN
            </Badge>
          )}
        </div>
      </div>

      {/* Article header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{title}</h1>
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            元記事を読む <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Tab navigation (English articles only) */}
      {article.isEnglish && (
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 -mb-1">
          <button
            onClick={() => setTab("explanation")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === "explanation"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            📖 解説
          </button>
          <button
            onClick={() => setTab("translation")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === "translation"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Languages size={14} />
            英日対訳
          </button>
        </div>
      )}

      {/* Content */}
      {tab === "explanation" && (
        <ExplanationShell
          articleId={id}
          articleTitle={title}
          articleContent={content}
        />
      )}
      {tab === "translation" && article.isEnglish && (
        <TranslationView article={article} />
      )}
    </div>
  );
}
