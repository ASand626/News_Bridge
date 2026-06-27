import Link from "next/link";
import { Clock, Globe } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/types";

const CAT_LABELS: Record<string, string> = {
  ai: "🤖 AI", web3: "⛓️ Web3", finance: "💰 金融", economy: "📊 経済", tech: "💻 テック",
};

export function NewsCard({ article }: { article: NewsArticle }) {
  const title = article.titleJa || article.titleEn;
  return (
    <Link href={`/news/${article.id}`} className="block group">
      <article className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 h-full">
        {article.imageUrl && (
          <div className="relative w-full h-40 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && <Badge variant="secondary">{CAT_LABELS[article.category]}</Badge>}
            {article.isEnglish && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe size={10} /> EN
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Clock size={11} />
            {timeAgo(article.publishedAt)}
          </div>
        </div>
      </article>
    </Link>
  );
}
