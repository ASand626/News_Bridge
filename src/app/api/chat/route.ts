import { NextRequest } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import { CHAT_SYSTEM_PROMPT } from "@/lib/claude/prompts";
import { searchRelated } from "@/lib/tavily/client";

export async function POST(req: NextRequest) {
  const { messages, articleTitle, articleContent, explanationContext } = await req.json();
  if (!messages?.length) return new Response("messages required", { status: 400 });

  const lastMsg = messages[messages.length - 1]?.content ?? "";
  const web = await searchRelated(lastMsg);

  const system = [
    CHAT_SYSTEM_PROMPT,
    articleTitle ? `\n\n【読んでいる記事】\nタイトル: ${articleTitle}\n本文: ${articleContent ?? ""}` : "",
    explanationContext ? `\n\n【この記事のAI解説（①〜④）】\n${explanationContext}` : "",
    web ? `\n\n【最新Web情報】\n${web}` : "",
  ].join("");

  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(enc.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
