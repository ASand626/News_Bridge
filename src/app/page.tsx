import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ArticleInput } from "@/features/articles/components/ArticleInput";
import { ArticlesList } from "@/features/articles/components/ArticlesList";
import { FavoriteSites } from "@/features/sites/components/FavoriteSites";

export default function HomePage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">
          ニュースを理解しよう
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          URLか記事本文を貼るだけでAIがわかりやすく解説します
        </p>
      </div>

      <ArticleInput />
      <FavoriteSites />

      <Link
        href="/terms"
        className="flex items-center justify-between rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">用語集を見る</span>
        </div>
        <span className="text-xs text-amber-600 dark:text-amber-400">お気に入り登録した用語 →</span>
      </Link>

      <ArticlesList />
    </div>
  );
}
