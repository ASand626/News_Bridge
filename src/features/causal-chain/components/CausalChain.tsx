"use client";
import dynamic from "next/dynamic";

const MermaidChart = dynamic(
  () => import("./MermaidChart").then((m) => m.MermaidChart),
  { ssr: false, loading: () => null }
);

interface Props {
  mmdCode: string;
  textFallback: string;
  articleId: string;
}

export function CausalChain({ mmdCode, textFallback, articleId }: Props) {
  const arrows = textFallback.split(/→|->/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Mermaid図 */}
      {mmdCode && (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 p-4 overflow-hidden">
          <MermaidChart chart={mmdCode} id={articleId} />
        </div>
      )}

      {/* テキスト版（モバイルでも読みやすい） */}
      {arrows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {arrows.map((step, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-3 py-1.5 text-sm font-medium text-blue-800 dark:text-blue-200">
                {step}
              </span>
              {i < arrows.length - 1 && (
                <span className="text-zinc-400 dark:text-zinc-500 font-bold">→</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
