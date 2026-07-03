import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";

async function fetchViaJina(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "Accept": "text/plain", "X-Return-Format": "text" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, 10000);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const { title, content, url } = await req.json();

  let articleContent = content ?? "";

  // URLが指定されていて本文がない場合はJina Readerで取得
  if (url && !articleContent) {
    articleContent = await fetchViaJina(url);
    if (!articleContent) {
      return NextResponse.json({ error: "記事の取得に失敗しました。本文を直接貼り付けてください。" }, { status: 422 });
    }
  }

  if (!title && !articleContent) {
    return NextResponse.json({ error: "title or content required" }, { status: 400 });
  }

  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: `あなたは英日翻訳の専門家です。与えられた英語のタイトルと本文を自然な日本語に翻訳し、必ず以下のJSON形式のみで出力してください。説明・注記は不要です。
{"titleJa":"翻訳されたタイトル","contentJa":"翻訳された本文"}`,
      messages: [{ role: "user", content: `タイトル: ${title ?? ""}\n\n本文: ${articleContent}` }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const json = raw.match(/```json\s*([\s\S]*?)\s*```/)?.[1] ?? raw;
    const { titleJa, contentJa } = JSON.parse(json);
    return NextResponse.json({ titleJa: titleJa ?? "", contentJa: contentJa ?? "", fetchedContent: articleContent });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
