"use client";
import { useEffect, useReducer, useRef } from "react";
import { loadExplanation, saveExplanation } from "@/lib/storage";
import type { ExplanationState, ImpactCard } from "@/types";

type Action =
  | { type: "SECTION"; name: string; content: string }
  | { type: "DONE" }
  | { type: "ERROR"; message: string };

const INIT: ExplanationState = {
  summary: null, background: null,
  causalChainMmd: null, causalChainText: null,
  impactCards: null,
  loading: true, done: false, error: null,
};

function applySection(state: ExplanationState, name: string, content: string): ExplanationState {
  switch (name) {
    case "summary":          return { ...state, summary: content };
    case "background":       return { ...state, background: content };
    case "causal_chain_mmd": return { ...state, causalChainMmd: content };
    case "causal_chain_text":return { ...state, causalChainText: content };
    case "impact_cards": {
      try { return { ...state, impactCards: JSON.parse(content) as ImpactCard[] }; }
      catch { return state; }
    }
    default: return state;
  }
}

function reducer(state: ExplanationState, action: Action): ExplanationState {
  switch (action.type) {
    case "SECTION": return applySection(state, action.name, action.content);
    case "DONE":    return { ...state, loading: false, done: true };
    case "ERROR":   return { ...state, loading: false, error: action.message };
    default:        return state;
  }
}

function extractSections(text: string): { name: string; content: string }[] {
  const sections: { name: string; content: string }[] = [];
  const re = /\[SECTION:([^\]]+)\]([\s\S]*?)\[\/SECTION\]/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    sections.push({ name: match[1].trim(), content: match[2].trim() });
  }
  return sections;
}

export function useExplanation(articleId: string, title: string, content: string) {
  const [state, dispatch] = useReducer(reducer, INIT);
  const accRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    accRef.current = "";

    (async () => {
      // ① キャッシュ確認（localStorage → Supabase）
      const cached = await loadExplanation(articleId);
      if (cancelled) return;
      if (cached) {
        for (const s of extractSections(cached)) dispatch({ type: "SECTION", name: s.name, content: s.content });
        dispatch({ type: "DONE" });
        return;
      }

      // ② キャッシュなし → SSEで生成
      let processedUpTo = 0;
      try {
        const res = await fetch(`/api/explain/${articleId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!res.ok || !res.body) throw new Error("解説の生成に失敗しました");

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          sseBuffer += dec.decode(value, { stream: true });
          const lines = sseBuffer.split("\n\n");
          sseBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));

              if (payload.type === "delta" && payload.text) {
                accRef.current += payload.text;
                const newSections = extractSections(accRef.current.slice(processedUpTo));
                for (const s of newSections) dispatch({ type: "SECTION", name: s.name, content: s.content });
                if (newSections.length > 0) {
                  const idx = accRef.current.lastIndexOf("[/SECTION]");
                  if (idx >= 0) processedUpTo = idx + "[/SECTION]".length;
                }
              }

              if (payload.type === "done") {
                // 残りのセクションを処理
                for (const s of extractSections(accRef.current.slice(processedUpTo))) {
                  dispatch({ type: "SECTION", name: s.name, content: s.content });
                }
                // キャッシュ保存（localStorage + Supabase）
                await saveExplanation(articleId, accRef.current);
                if (!cancelled) dispatch({ type: "DONE" });
              }
            } catch { /* SSEパースエラーは無視 */ }
          }
        }
      } catch (e) {
        if (!cancelled) dispatch({ type: "ERROR", message: e instanceof Error ? e.message : "エラーが発生しました" });
      }
    })();

    return () => { cancelled = true; };
  }, [articleId, title, content]);

  return state;
}
