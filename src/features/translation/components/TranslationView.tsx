"use client";
import { useEffect, useState } from "react";
import { Languages, Loader2, ClipboardPaste, Link2, RotateCcw, AlertCircle } from "lucide-react";
import { TermSelector } from "@/features/terms/components/TermSelector";
import { loadTranslation, saveTranslation } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types";

type InputMode = "url" | "text";
type Step = "input" | "fetching" | "translating" | "result";

interface Props {
  article: NewsArticle;
}

export function TranslationView({ article }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<InputMode>("url");
  const [urlInput, setUrlInput] = useState(article.url ?? "");
  const [textInput, setTextInput] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [contentJa, setContentJa] = useState("");
  const [cachedEn, setCachedEn] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  async function submit() {
    setError(null);

    const isUrl = mode === "url";
    const payload = isUrl
      ? { title: article.titleEn, url: urlInput.trim() }
      : { title: article.titleEn, content: textInput.trim() };

    if (isUrl && !urlInput.trim()) return;
    if (!isUrl && !textInput.trim()) return;

    setStep(isUrl ? "fetching" : "translating");

    try {
      const res = await fetch(`/api/translate/${article.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "翻訳に失敗しました");
        // URLモードで取得失敗 → テキストモードに切り替えを促す
        if (res.status === 422) setMode("text");
        setStep("input");
        return;
      }

      const fetchedEn = data.fetchedContent ?? textInput;
      setTitleJa(data.titleJa);
      setContentJa(data.contentJa);
      setCachedEn(fetchedEn);
      saveTranslation(article.id, { titleJa: data.titleJa, contentJa: data.contentJa, contentEn: fetchedEn });
      setStep("result");
    } catch {
      setError("翻訳に失敗しました。もう一度試してください。");
      setStep("input");
    }
  }

  function reset() {
    setTextInput("");
    setError(null);
    setStep("input");
  }

  const isWorking = step === "fetching" || step === "translating";
  const loadingLabel = step === "fetching" ? "記事を取得中..." : "翻訳中...";

  // ── 入力フォーム ──────────────────────────────────────────────────────────────
  if (step !== "result") {
    return (
      <div className="space-y-4">
        {/* モード切り替えタブ */}
        <div className="flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 w-fit">
          <button
            onClick={() => setMode("url")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              mode === "url"
                ? "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Link2 size={12} /> URLで取得
          </button>
          <button
            onClick={() => setMode("text")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              mode === "text"
                ? "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <ClipboardPaste size={12} /> テキストを貼り付け
          </button>
        </div>

        {/* URLモード */}
        {mode === "url" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              記事のURLを貼り付けると本文を自動取得して翻訳します。ペイウォール記事は取得できません。
            </p>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* テキストモード */}
        {mode === "text" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              元記事を開いて全文をコピーし、以下に貼り付けてください。
            </p>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="ここに英語の記事本文を貼り付けてください..."
              rows={10}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 text-xs text-red-700 dark:text-red-400">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{error}{mode === "text" ? "" : " テキストを直接貼り付けてください。"}</span>
          </div>
        )}

        <button
          onClick={submit}
          disabled={isWorking || (mode === "url" ? !urlInput.trim() : !textInput.trim())}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {isWorking ? (
            <><Loader2 size={14} className="animate-spin" /> {loadingLabel}</>
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
          再取得
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
