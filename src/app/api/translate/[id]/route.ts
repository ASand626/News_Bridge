import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import { extractArticleContent } from "@/lib/tavily/client";

export async function POST(req: NextRequest) {
  const { title, content, url } = await req.json();
  if (!title && !content) return NextResponse.json({ error: "title or content required" }, { status: 400 });

  // URLがあればTavilyでフル本文を取得、なければAPIの短縮本文を使用
  let fullContent = content ?? "";
  if (url) {
    const extracted = await extractArticleContent(url);
    if (extracted.length > fullContent.length) {
      fullContent = extracted;
    }
  }

  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: `あなたは英日翻訳の専門家です。与えられた英語のタイトルと本文を自然な日本語に翻訳し、必ず以下のJSON形式のみで出力してください。説明・注記は不要です。
{"titleJa":"翻訳されたタイトル","contentJa":"翻訳された本文"}`,
      messages: [{ role: "user", content: `タイトル: ${title ?? ""}\n\n本文: ${fullContent}` }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const json = raw.match(/```json\s*([\s\S]*?)\s*```/)?.[1] ?? raw;
    const { titleJa, contentJa } = JSON.parse(json);
    return NextResponse.json({ titleJa: titleJa ?? "", contentJa: contentJa ?? "" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
