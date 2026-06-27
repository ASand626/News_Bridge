"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Star, Loader2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveFavoriteTerm, removeFavoriteTerm, getFavoriteTerms } from "@/lib/storage";

interface TermData {
  term: string;
  shortDesc: string;
  detailDesc: string;
  examples: string[];
  relatedTerms: string[];
  whyImportant: string;
  category: string;
}

interface Props {
  term: string;
  prefetched?: TermData;
  onClose: () => void;
}

const CAT_LABELS: Record<string, string> = {
  finance: "💰 金融", web3: "⛓️ Web3", ai: "🤖 AI", economy: "📊 経済", tech: "💻 テック",
};

async function fetchTerm(term: string): Promise<TermData> {
  const res = await fetch(`/api/glossary/${encodeURIComponent(term)}`);
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d as TermData;
}

export function TermModal({ term: initialTerm, prefetched, onClose }: Props) {
  // ナビゲーション履歴
  const [history, setHistory] = useState<TermData[]>([]);
  const [current, setCurrent] = useState<TermData | null>(prefetched ?? null);
  const [loading, setLoading] = useState(!prefetched);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const favCacheRef = useRef<TermData[]>([]);

  // お気に入りキャッシュをロード（一度だけ）
  useEffect(() => {
    getFavoriteTerms().then((all) => {
      favCacheRef.current = all.map((t) => ({
        term: t.term, shortDesc: t.shortDesc, detailDesc: t.detailDesc,
        examples: t.examples, relatedTerms: t.relatedTerms,
        whyImportant: t.whyImportant, category: t.category,
      }));
    });
  }, []);

  // 現在の用語が変わるたびにお気に入り状態を確認
  useEffect(() => {
    const term = current?.term ?? initialTerm;
    getFavoriteTerms().then((all) => setFavorited(all.some((t) => t.term === term)));
  }, [current, initialTerm]);

  // 初回ロード
  useEffect(() => {
    if (prefetched) return;
    setLoading(true);
    fetchTerm(initialTerm)
      .then(setCurrent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialTerm, prefetched]);

  async function navigateTo(term: string) {
    // お気に入りキャッシュを先にチェック（APIなし）
    const cached = favCacheRef.current.find((t) => t.term === term);
    if (current) setHistory((h) => [...h, current]);
    if (cached) {
      setCurrent(cached);
      return;
    }
    // キャッシュにない場合はAPI呼び出し
    setCurrent(null);
    setLoading(true);
    setError(null);
    fetchTerm(term)
      .then(setCurrent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function goBack() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setCurrent(prev);
    setError(null);
  }

  async function toggleFavorite() {
    if (!current) return;
    setFavLoading(true);
    if (favorited) {
      await removeFavoriteTerm(current.term);
      favCacheRef.current = favCacheRef.current.filter((t) => t.term !== current.term);
      setFavorited(false);
    } else {
      await saveFavoriteTerm({
        term: current.term,
        shortDesc: current.shortDesc ?? "",
        detailDesc: current.detailDesc ?? "",
        examples: current.examples ?? [],
        relatedTerms: current.relatedTerms ?? [],
        whyImportant: current.whyImportant ?? "",
        category: current.category ?? "",
      });
      favCacheRef.current = [...favCacheRef.current, current];
      setFavorited(true);
    }
    setFavLoading(false);
  }

  const displayTerm = current?.term ?? initialTerm;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          {/* 戻るボタン */}
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-2 transition-colors w-fit"
            >
              <ChevronLeft size={13} />
              {history[history.length - 1].term} に戻る
            </button>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {current?.category && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                  {CAT_LABELS[current.category] ?? current.category}
                </span>
              )}
              <DialogTitle className="text-xl leading-snug">{displayTerm}</DialogTitle>
              {current?.shortDesc && (
                <DialogDescription className="mt-1">{current.shortDesc}</DialogDescription>
              )}
            </div>
            <button
              onClick={toggleFavorite}
              disabled={favLoading || loading}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-all mt-1",
                favorited
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-300 hover:text-amber-600"
              )}
            >
              <Star size={13} className={favorited ? "fill-amber-500 text-amber-500" : ""} />
              {favorited ? "登録済み" : "お気に入り"}
            </button>
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-zinc-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">AIが解説中...</span>
          </div>
        )}

        {error && <p className="text-sm text-red-500 py-4">{error}</p>}

        {current && !loading && (
          <div className="space-y-4 text-sm mt-2">
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">詳しく説明すると</h4>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{current.detailDesc}</p>
            </div>

            {(current.examples?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">具体例</h4>
                <ul className="space-y-1">
                  {current.examples.map((ex, i) => (
                    <li key={i} className="flex gap-2 text-zinc-700 dark:text-zinc-300">
                      <span className="text-blue-500 shrink-0">•</span>{ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {current.whyImportant && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">なぜ重要か</h4>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{current.whyImportant}</p>
              </div>
            )}

            {(current.relatedTerms?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">関連用語</h4>
                <div className="flex flex-wrap gap-2">
                  {current.relatedTerms.map((t) => {
                    const isCached = favCacheRef.current.some((f) => f.term === t);
                    return (
                      <button
                        key={t}
                        onClick={() => navigateTo(t)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs transition-colors text-left",
                          isCached
                            ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        )}
                      >
                        {isCached && <Star size={9} className="inline mr-1 fill-amber-500 text-amber-500" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  タップすると詳しく調べられます
                  {favCacheRef.current.length > 0 && "（⭐はお気に入り済み・API不要）"}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
