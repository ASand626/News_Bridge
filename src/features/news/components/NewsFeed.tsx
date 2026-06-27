import { NewsCard } from "./NewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsArticle } from "@/types";

export function NewsFeed({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) {
    return (
      <div className="col-span-2 text-center py-16 text-zinc-400 dark:text-zinc-500">
        <p className="text-lg font-medium mb-1">ニュースを取得できませんでした</p>
        <p className="text-sm">.env.local に NEWS_API_KEY または GNEWS_API_KEY を設定してください</p>
      </div>
    );
  }
  return (
    <>
      {articles.map((a) => <NewsCard key={a.id} article={a} />)}
    </>
  );
}

export function NewsFeedSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}
