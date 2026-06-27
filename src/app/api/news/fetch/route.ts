import { NextRequest, NextResponse } from "next/server";
import { getArticlesByCategory } from "@/lib/news-providers";
import type { NewsCategory } from "@/types";

export async function GET(req: NextRequest) {
  const cat = (req.nextUrl.searchParams.get("category") ?? "ai") as NewsCategory;
  const articles = await getArticlesByCategory(cat);
  return NextResponse.json(articles);
}
