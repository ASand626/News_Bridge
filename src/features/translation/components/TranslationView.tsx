"use client";
import { useEffect, useState } from "react";
import { Languages, Loader2, ClipboardPaste, RotateCcw } from "lucide-react";
import { TermSelector } from "@/features/terms/components/TermSelector";
import { loadTranslation, saveTranslation } from "@/lib/storage";
import type { NewsArticle } from "@/types";

type Step = "input" | "translating" | "result";

interface Props {
  article: NewsArticle;
}

export function TranslationView({ article }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [inputText, setInputText] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [contentJa, setContentJa] = useState("");
  const [cachedEn, setCachedEn] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    loadTranslation(article.id).then((cached) => {
      if (cached) {
        setTitleJa(cached.titleJa);
        setContentJa(cached.contentJa);
        setCachedEn(cached.contentEn ?? "");
        setStep("result");
      }
    });
  }, [article.id]);

  async function translate() {
    const text = inputText.trim();
    if (!text) return;
    setStep("translating");
    setError(false);
    try {
      const res = await fetch(`/api/translate/${article.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: article.titleEn, content: text }),
      });
      if (!res.ok) throw new Error();
      const { titleJa: tJa, contentJa: cJa } = await res.json();
      setTitleJa(tJa);
      setContentJa(cJa);
      setCachedEn(text);
      saveTranslation(article.id, { titleJa: tJa, contentJa: cJa, contentEn: text });
      setStep("result");
    } catch {
      setError(true);
      setStep("input");
    }
  }

  function reset() {
    setInputText("");
    setStep("input");
  }

  // ── 入力フォーム ──────────────────────────────────────────────────────────────
  if (step === "input" || step === "translating") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/10 p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <ClipboardPaste size={14} className="text-blue-500 shrink-0" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              元記事の英語本文を貼り付けてください
            </p>
          </div>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 pl-5">
            元記事を開いて全文をコピー → 下のテキストエリアに貼り付け → 翻訳ボタンをタップ
          </p>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="ここに英語の記事本文を貼り付けてください..."
          rows={10}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
        />

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">翻訳に失敗しました。もう一度試してください。</p>
        )}

        <button
          onClick={translate}
          disabled={!inputText.trim() || step === "translating"}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {step === "translating" ? (
            <><Loader2 size={14} className="animate-spin" /> 翻訳中...</>
          ) : (
            <><Languages size={14} /> 翻訳する</>
          )}
        </button>
      </div>
    );
  }

  // ── 対訳表示 ──────────────────────────────────────────────────────────────────
  const enContent = cachedEn || article.contentEn || "(本文なし)";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <Languages size={12} />
          テキストを選択して用語を調べられます
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <RotateCcw size={11} />
          貼り直す
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* English original */}
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/10 p-4 space-y-3">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">🇺🇸 Original</span>
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug text-base">
            {article.titleEn}
          </h2>
          <TermSelector lang="en">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {enContent}
            </p>
          </TermSelector>
        </div>

        {/* Japanese translation */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">🇯🇵 日本語訳</span>
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug text-base">
            {titleJa}
          </h2>
          <TermSelector lang="ja">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {contentJa}
            </p>
          </TermSelector>
        </div>
      </div>
    </div>
  );
}
