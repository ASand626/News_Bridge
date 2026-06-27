"use client";
import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { getFavoriteTerms, removeFavoriteTerm } from "@/lib/storage";
import { TermModal } from "./TermModal";
import type { TermFavorite } from "@/types";

const CAT_COLORS: Record<string, string> = {
  finance:  "bg-green-50  dark:bg-green-950/30  border-green-200  dark:border-green-800  text-green-700  dark:text-green-300",
  web3:     "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
  ai:       "bg-blue-50   dark:bg-blue-950/30   border-blue-200   dark:border-blue-800   text-blue-700   dark:text-blue-300",
  economy:  "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300",
  tech:     "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300",
};

export function TermFavoritesList() {
  const [terms, setTerms] = useState<TermFavorite[]>([]);
  const [active, setActive] = useState<TermFavorite | null>(null);

  useEffect(() => { getFavoriteTerms().then(setTerms); }, []);

  async function remove(term: string) {
    await removeFavoriteTerm(term);
    setTerms((p) => p.filter((t) => t.term !== term));
  }

  if (terms.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Star size={13} className="text-amber-500 fill-amber-500" />
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            覚えた用語
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {terms.map((t) => (
            <div key={t.term} className="group relative">
              <button
                onClick={() => setActive(t)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm ${CAT_COLORS[t.category] ?? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"}`}
              >
                {t.term}
                <span className="text-xs opacity-60">{t.shortDesc}</span>
              </button>
              <button
                onClick={() => remove(t.term)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-400 dark:bg-zinc-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <Trash2 size={8} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {active && (
        <TermModal
          term={active.term}
          prefetched={{
            term: active.term,
            shortDesc: active.shortDesc,
            detailDesc: active.detailDesc,
            examples: active.examples,
            relatedTerms: active.relatedTerms,
            whyImportant: active.whyImportant,
            category: active.category,
          }}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
