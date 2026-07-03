"use client";
import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { addBookmark, removeBookmark, isBookmarkedLocal } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types";

interface Props {
  article: NewsArticle;
}

export function BookmarkButton({ article }: Props) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarkedLocal(article.id));
  const [pending, setPending] = useState(false);

  // マウント後にローカルストレージを再確認
  useEffect(() => {
    setBookmarked(isBookmarkedLocal(article.id));
  }, [article.id]);

  async function toggle() {
    if (pending) return;
    setPending(true);
    try {
      if (bookmarked) {
        await removeBookmark(article.id);
        setBookmarked(false);
      } else {
        await addBookmark(article);
        setBookmarked(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={bookmarked ? "お気に入りから削除" : "お気に入りに追加"}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
        bookmarked
          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700",
        pending && "opacity-60 cursor-not-allowed"
      )}
    >
      <Star
        size={13}
        className={cn("transition-all", bookmarked ? "fill-amber-500 text-amber-500" : "")}
      />
      {bookmarked ? "保存済み" : "お気に入り"}
    </button>
  );
}
