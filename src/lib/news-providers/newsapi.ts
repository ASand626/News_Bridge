import type { NewsCategory } from "@/types";

const BASE = "https://newsapi.org/v2";

const QUERIES: Record<NewsCategory, string> = {
  ai: "人工知能 OR AI テクノロジー",
  web3: "Web3 OR ブロックチェーン OR 暗号資産 OR DeFi",
  finance: "株式 OR 投資 OR 金融 OR 市場",
  economy: "経済 OR GDP OR インフレ OR 金利 OR 日銀",
  tech: "テクノロジー OR スタートアップ OR イノベーション",
};

const EN_QUERIES: Record<NewsCategory, string> = {
  ai: "artificial intelligence OR machine learning",
  web3: "Web3 OR blockchain OR cryptocurrency OR DeFi",
  finance: "finance OR stock market OR investment",
  economy: "economy OR inflation OR interest rate OR central bank",
  tech: "technology OR startup OR innovation",
};

export interface NewsApiArticle {
  source: { name: string };
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

async function fetchArticles(params: Record<string, string>): Promise<NewsApiArticle[]> {
  const url = new URL(`${BASE}/everything`);
  Object.entries({ ...params, apiKey: process.env.NEWS_API_KEY!, pageSize: "8" })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).filter((a: NewsApiArticle) => a.title && a.title !== "[Removed]");
  } catch { return []; }
}

export const fetchJa = (cat: NewsCategory) =>
  fetchArticles({ q: QUERIES[cat], language: "ja", sortBy: "publishedAt" });

export const fetchEn = (cat: NewsCategory) =>
  fetchArticles({ q: EN_QUERIES[cat], language: "en", sortBy: "publishedAt" });

export const fetchJaQuery = (query: string) =>
  fetchArticles({ q: query, language: "ja", sortBy: "publishedAt" });
