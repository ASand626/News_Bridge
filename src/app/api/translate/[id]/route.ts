import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import { TRANSLATION_SYSTEM_PROMPT } from "@/lib/claude/prompts";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: TRANSLATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });
    const translated = msg.content[0].type === "text" ? msg.content[0].text : "";
    return NextResponse.json({ translated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
