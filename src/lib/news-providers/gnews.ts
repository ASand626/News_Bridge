import type { NewsCategory } from "@/types";

const BASE = "https://gnews.io/api/v4";
const TOPICS: Record<NewsCategory, string> = {
  ai: "technology", web3: "technology",
  finance: "business", economy: "business", tech: "technology",
};
const KEYWORDS: Record<NewsCategory, string> = {
  ai: "AI 人工知能", web3: "Web3 ブロックチェーン 暗号資産",
  finance: "株式 投資 金融", economy: "経済 インフレ 金利",
  tech: "テクノロジー スタートアップ",
};

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
}

export async function fetchJa(cat: NewsCategory): Promise<GNewsArticle[]> {
  const url = new URL(`${BASE}/top-headlines`);
  url.searchParams.set("topic", TOPICS[cat]);
  url.searchParams.set("lang", "ja");
  url.searchParams.set("country", "jp");
  url.searchParams.set("max", "5");
  url.searchParams.set("apikey", process.env.GNEWS_API_KEY!);
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles ?? [];
  } catch { return []; }
}

export async function fetchEn(cat: NewsCategory): Promise<GNewsArticle[]> {
  const url = new URL(`${BASE}/search`);
  url.searchParams.set("q", KEYWORDS[cat]);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", "3");
  url.searchParams.set("apikey", process.env.GNEWS_API_KEY!);
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles ?? [];
  } catch { return []; }
}
