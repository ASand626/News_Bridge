"use client";
import { useEffect, useState } from "react";
import { Star, BookOpen, Search, Trash2 } from "lucide-react";
import { getFavoriteTerms, removeFavoriteTerm } from "@/lib/storage";
import { TermModal } from "./TermModal";
import { cn } from "@/lib/utils";
import type { TermFavorite } from "@/types";

const CATEGORIES = [
  { id: "all",      label: "すべて",   icon: "📚" },
  { id: "web3",     label: "Web3",     icon: "⛓️" },
  { id: "ai",       label: "AI",       icon: "🤖" },
  { id: "finance",  label: "金融",     icon: "💰" },
  { id: "economy",  label: "経済",     icon: "📊" },
  { id: "tech",     label: "テック",   icon: "💻" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

const CAT_COLORS: Record<string, string> = {
  web3:    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  ai:      "bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300",
  finance: "bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300",
  economy: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  tech:    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
};

const CARD_BORDER: Record<string, string> = {
  web3:    "border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600",
  ai:      "border-blue-200   dark:border-blue-800   hover:border-blue-400   dark:hover:border-blue-600",
  finance: "border-green-200  dark:border-green-800  hover:border-green-400  dark:hover:border-green-600",
  economy: "border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600",
  tech:    "border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600",
};

export function TermsPageClient() {
  const [jaTerms, setJaTerms] = useState<TermFavorite[]>([]);
  const [enTerms, setEnTerms] = useState<TermFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<TermFavorite | null>(null);

  useEffect(() => {
    Promise.all([getFavoriteTerms("ja"), getFavoriteTerms("en")]).then(([ja, en]) => {
      setJaTerms(ja);
      setEnTerms(en);
      setLoading(false);
    });
  }, []);

  const terms = lang === "ja" ? jaTerms : enTerms;
  const totalCount = jaTerms.length + enTerms.length;

  async function remove(term: string, e: React.MouseEvent) {
    e.stopPropagation();
    await removeFavoriteTerm(term, lang);
    if (lang === "ja") setJaTerms((p) => p.filter((t) => t.term !== term));
    else setEnTerms((p) => p.filter((t) => t.term !== term));
  }

  const filtered = terms.filter((t) => {
    const matchCat = category === "all" || t.category === category;
    const matchQ = query === "" ||
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.shortDesc.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  const counts: Record<string, number> = { all: terms.length };
  for (const t of terms) counts[t.category] = (counts[t.category] ?? 0) + 1;

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen size={22} className="text-amber-500" />
          用語集
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          お気に入り登録した用語 {totalCount}件
        </p>
      </div>

      {/* 言語タブ */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setLang("ja")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            lang === "ja"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          🇯🇵 日本語
          {jaTerms.length > 0 && (
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full px-1.5">{jaTerms.length}</span>
          )}
        </button>
        <button
          onClick={() => setLang("en")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            lang === "en"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          🇺🇸 English
          {enTerms.length > 0 && (
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full px-1.5">{enTerms.length}</span>
          )}
        </button>
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "en" ? "Search terms..." : "用語を検索..."}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              category === id
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <span>{icon}</span>
            {label}
            {counts[id] > 0 && (
              <span className={cn(
                "text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center",
                category === id ? "bg-white/20 dark:bg-zinc-900/20" : "bg-zinc-200 dark:bg-zinc-700"
              )}>
                {counts[id] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 用語グリッド */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Star size={36} className="mx-auto text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            {terms.length === 0
              ? (lang === "en" ? "No English terms saved yet" : "まだ用語が登録されていません")
              : (lang === "en" ? "No matching terms" : "該当する用語がありません")}
          </p>
          {terms.length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              {lang === "en"
                ? 'Select text in the English translation view and tap "Look up" to save terms.'
                : "解説ページでテキストを選択して「調べる」→「お気に入り」で登録できます"}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((t) => (
            <div
              key={t.term}
              role="button"
              tabIndex={0}
              onClick={() => setActive(t)}
              onKeyDown={(e) => e.key === "Enter" && setActive(t)}
              className={cn(
                "group relative cursor-pointer rounded-2xl border bg-white dark:bg-zinc-900 p-4 transition-all hover:shadow-md",
                CARD_BORDER[t.category] ?? "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-xs font-medium rounded-full px-2.5 py-0.5",
                  CAT_COLORS[t.category] ?? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                  {CATEGORIES.find((c) => c.id === t.category)?.icon}{" "}
                  {CATEGORIES.find((c) => c.id === t.category)?.label ?? t.category}
                </span>
                <button
                  onClick={(e) => remove(t.term, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                {t.term}
              </p>

              {t.shortDesc && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {t.shortDesc}
                </p>
              )}

              {(t.relatedTerms?.length ?? 0) > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {t.relatedTerms.slice(0, 3).map((r) => (
                    <span key={r} className="text-xs rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5">
                      {r}
                    </span>
                  ))}
                  {t.relatedTerms.length > 3 && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 px-1 py-0.5">
                      +{t.relatedTerms.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {active && (
        <TermModal
          term={active.term}
          prefetched={active}
          lang={active.language ?? lang}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
