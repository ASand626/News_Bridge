"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useExplanation } from "../hooks/useExplanation";
import { SummarySection } from "./SummarySection";
import { BackgroundSection } from "./BackgroundSection";
import { ImpactCards } from "./ImpactCards";
import { CausalChain } from "@/features/causal-chain/components/CausalChain";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { TermSelector } from "@/features/terms/components/TermSelector";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  articleId: string;
  articleTitle: string;
  articleContent: string;
}

const STEPS = [
  "Tavilyで最新情報を検索中...",
  "記事を分析中...",
  "因果関係を整理中...",
  "影響を評価中...",
  "キーワードを抽出中...",
  "解説を仕上げています...",
];

export function ExplanationShell({ articleId, articleTitle, articleContent }: Props) {
  const exp = useExplanation(articleId, articleTitle, articleContent);
  const [elapsed] = useState(0);
  const stepIndex = Math.min(Math.floor(elapsed / 8), STEPS.length - 1);

  if (exp.error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400">
        <p className="font-medium">{exp.error}</p>
        <p className="mt-1 text-xs opacity-70">ANTHROPIC_API_KEY を確認してください</p>
      </div>
    );
  }

  const anySection = exp.summary || exp.background || exp.causalChainText || exp.impactCards;

  const explanationContext = [
    exp.summary    && `【① 何が起きた？】\n${exp.summary}`,
    exp.background && `【② なぜ起きた？】\n${exp.background}`,
    exp.causalChainText && `【③ どうつながる？】\n${exp.causalChainText}`,
    exp.impactCards && `【④ 何が変わる？】\n${exp.impactCards.map((c) => `・${c.title}：${c.content}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");

  return (
    <TermSelector>
    <div className="space-y-4">
      {/* ローディング中プログレス */}
      {exp.loading && (
        <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">AI解説を生成中</p>
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 ml-7">{STEPS[stepIndex]}</p>
        </div>
      )}

      {/* ① 何が起きた？ */}
      {exp.summary ? (
        <SummarySection summary={exp.summary} />
      ) : exp.loading ? (
        <SectionSkeleton label="① 何が起きた？" />
      ) : null}

      {/* ② なぜ起きた？ */}
      {exp.background ? (
        <BackgroundSection background={exp.background} />
      ) : exp.loading && exp.summary ? (
        <SectionSkeleton label="② なぜ起きた？" />
      ) : null}

      {/* ③ どうつながる？ */}
      {(exp.causalChainMmd || exp.causalChainText) ? (
        <SectionWrapper title="③ どうつながる？" icon="🔗" accent="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40">
          <CausalChain
            mmdCode={exp.causalChainMmd ?? ""}
            textFallback={exp.causalChainText ?? ""}
            articleId={articleId}
          />
        </SectionWrapper>
      ) : exp.loading && exp.background ? (
        <SectionSkeleton label="③ どうつながる？" />
      ) : null}

      {/* ④ 何が変わる？ */}
      {exp.impactCards ? (
        <ImpactCards cards={exp.impactCards} />
      ) : exp.loading && exp.causalChainText ? (
        <SectionSkeleton label="④ 何が変わる？" />
      ) : null}

      {/* ⑤ AIに質問する (解説完了後に表示) */}
      {!anySection ? null : (
        <SectionWrapper title="⑤ AIに質問する" icon="💬" accent="">
          <div className="h-[440px] flex flex-col">
            <ChatPanel
              articleId={articleId}
              articleTitle={articleTitle}
              articleContent={articleContent}
              explanationContext={explanationContext}
            />
          </div>
        </SectionWrapper>
      )}
    </div>
    </TermSelector>
  );
}

function SectionWrapper({
  title, icon, accent, children,
}: {
  title: string; icon: string; accent: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${accent}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <span>{icon}</span>
        <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">{label}を生成中...</p>
      </div>
    </div>
  );
}
