import { NextRequest } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import { EXPLANATION_SYSTEM_PROMPT } from "@/lib/claude/prompts";
import { searchRelated } from "@/lib/tavily/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, content } = await req.json();
  if (!title) return new Response("title required", { status: 400 });

  const tavilyContext = await searchRelated(title);

  const userPrompt = `以下のニュース記事を解説してください。

【タイトル】
${title}

【本文】
${content || "（本文なし）"}

${tavilyContext ? `【関連情報（最新Web検索）】\n${tavilyContext}` : ""}

指定のフォーマットで出力してください。`;

  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    system: EXPLANATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const send = (data: object) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      send({ type: "start", articleId: id });

      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            send({ type: "delta", text: chunk.delta.text });
          }
        }
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "生成に失敗しました" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
