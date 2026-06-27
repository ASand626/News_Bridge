import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import { GLOSSARY_SYSTEM_PROMPT } from "@/lib/claude/prompts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ term: string }> }
) {
  const { term } = await params;
  const decoded = decodeURIComponent(term);
  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: GLOSSARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `用語「${decoded}」を説明してください。` }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const json = raw.match(/```json\s*([\s\S]*?)\s*```/)?.[1] ?? raw;
    return NextResponse.json({ term: decoded, ...JSON.parse(json) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
