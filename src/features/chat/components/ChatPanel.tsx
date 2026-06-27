"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadChatMessages, saveChatMessage, type ChatMsg } from "@/lib/storage";
import { TermSelector } from "@/features/terms/components/TermSelector";

interface Msg extends ChatMsg {}

interface Props {
  articleId?: string;
  articleTitle?: string;
  articleContent?: string;
  explanationContext?: string;
}

const SUGGESTIONS = [
  "なぜ株価が上がるの？",
  "DAOって会社なの？",
  "なぜ円安になるの？",
  "インフレとは何ですか？",
];

export function ChatPanel({ articleId, articleTitle, articleContent, explanationContext }: Props) {
  const chatKey = articleId ?? "global";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // チャット履歴のロード
  useEffect(() => {
    loadChatMessages(chatKey).then((msgs) => {
      setMessages(msgs);
      setLoadingHistory(false);
    });
  }, [chatKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const prevMessages = messages;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const asstMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content: "" };

    setMessages((p) => [...p, userMsg, asstMsg]);
    setInput("");
    setLoading(true);

    // ユーザーメッセージを即時保存
    saveChatMessage(chatKey, userMsg, [...prevMessages, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...prevMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          articleId, articleTitle, articleContent, explanationContext,
        }),
      });
      if (!res.ok || !res.body) throw new Error("チャットに失敗しました");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((p) => p.map((m) => m.id === asstMsg.id ? { ...m, content: acc } : m));
      }

      // アシスタントの応答を保存
      const finalAsst = { ...asstMsg, content: acc };
      saveChatMessage(chatKey, finalAsst, [...prevMessages, userMsg, finalAsst]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "エラーが発生しました";
      setMessages((p) => p.map((m) => m.id === asstMsg.id ? { ...m, content: errMsg } : m));
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([]);
    try { localStorage.removeItem(`nb_chat_${chatKey}`); } catch {}
    // Supabaseからも削除
    import("@/lib/supabase/client").then(({ supabase }) => {
      supabase?.from("chat_messages").delete().eq("article_id", chatKey).then(() => {});
    });
  }

  if (loadingHistory) {
    return <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">読み込み中...</div>;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <TermSelector className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
            <Bot size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium mb-4">何でも質問してください</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn(
              "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
              m.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            )}>
              {m.role === "user" ? <User size={13} /> : <Bot size={13} />}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
              m.role === "user"
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
            )}>
              {m.content || (loading && m.role === "assistant" && (
                <span className="inline-flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      </TermSelector>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="質問を入力... (Enter で送信)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
          />
          {messages.length > 0 && (
            <Button type="button" variant="ghost" size="icon" onClick={clearHistory}
              className="text-zinc-400 hover:text-red-500 shrink-0" title="会話をリセット">
              <Trash2 size={15} />
            </Button>
          )}
          <Button type="submit" size="icon" disabled={!input.trim() || loading}>
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
