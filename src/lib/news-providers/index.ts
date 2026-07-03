import type { NewsArticle, NewsCategory, NewsSubcategory, PickedArticle } from "@/types";
import * as NewsApi from "./newsapi";
import * as GNews from "./gnews";
import { fetchCryptoNews, fetchNewsData } from "./newsdata";
import { createHash } from "crypto";

function hashId(str: string) {
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

export async function getArticlesByCategory(cat: NewsCategory): Promise<NewsArticle[]> {
  const [naJa, gnJa, naEn, gnEn] = await Promise.allSettled([
    NewsApi.fetchJa(cat),
    GNews.fetchJa(cat),
    NewsApi.fetchEn(cat),
    GNews.fetchEn(cat),
  ]);

  const articles: NewsArticle[] = [];

  if (naJa.status === "fulfilled") {
    for (const a of naJa.value) {
      articles.push({
        id: hashId(a.url),
        externalId: hashId(a.url),
        source: "newsapi",
        category: cat,
        titleJa: a.title,
        titleEn: a.title,
        contentJa: a.content ?? a.description ?? "",
        contentEn: a.content ?? a.description ?? "",
        description: a.description ?? "",
        url: a.url,
        imageUrl: a.urlToImage,
        isEnglish: false,
        publishedAt: a.publishedAt,
      });
    }
  }

  if (gnJa.status === "fulfilled") {
    for (const a of gnJa.value) {
      articles.push({
        id: hashId(a.url),
        externalId: hashId(a.url),
        source: "gnews",
        category: cat,
        titleJa: a.title,
        titleEn: a.title,
        contentJa: a.content ?? a.description ?? "",
        contentEn: a.content ?? a.description ?? "",
        description: a.description ?? "",
        url: a.url,
        imageUrl: a.image,
        isEnglish: false,
        publishedAt: a.publishedAt,
      });
    }
  }

  if (naEn.status === "fulfilled") {
    for (const a of naEn.value) {
      const id = hashId(a.url + "_en");
      articles.push({
        id,
        externalId: id,
        source: "newsapi",
        category: cat,
        titleJa: "",
        titleEn: a.title,
        contentJa: "",
        contentEn: a.content ?? a.description ?? "",
        description: a.description ?? "",
        url: a.url,
        imageUrl: a.urlToImage,
        isEnglish: true,
        publishedAt: a.publishedAt,
      });
    }
  }

  if (gnEn.status === "fulfilled") {
    for (const a of gnEn.value) {
      const id = hashId(a.url + "_en");
      articles.push({
        id,
        externalId: id,
        source: "gnews",
        category: cat,
        titleJa: "",
        titleEn: a.title,
        contentJa: "",
        contentEn: a.content ?? a.description ?? "",
        description: a.description ?? "",
        url: a.url,
        imageUrl: a.image,
        isEnglish: true,
        publishedAt: a.publishedAt,
      });
    }
  }

  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

// ── Today's Picks ─────────────────────────────────────────────────────────────

const WEB3_SUBCATS: {
  id: NewsSubcategory; label: string; icon: string;
  query?: string; coins?: string;
}[] = [
  { id: "web3_defi",       label: "DeFi",              icon: "🔄", query: "DeFi protocol", coins: "AAVE,UNI,CRV" },
  { id: "web3_nft",        label: "NFT・デジタルアセット", icon: "🎨", query: "NFT marketplace collection" },
  { id: "web3_regulation", label: "規制・法律",          icon: "⚖️", query: "crypto regulation bill law SEC CFTC" },
  { id: "web3_stablecoin", label: "ステーブルコイン",     icon: "💵", query: "stablecoin", coins: "USDT,USDC,DAI" },
  { id: "web3_infra",      label: "L1・L2インフラ",      icon: "⛓️", query: "blockchain network upgrade", coins: "ETH,BTC,SOL" },
];

const FINANCE_SUBCATS: { id: NewsSubcategory; label: string; icon: string; query: string }[] = [
  { id: "finance_stock",     label: "株式市場",     icon: "📈", query: "stock market earnings S&P Nasdaq" },
  { id: "finance_forex",     label: "為替・FX",     icon: "💱", query: "dollar yen euro forex exchange rate" },
  { id: "finance_bonds",     label: "債券・金利",   icon: "🏛️", query: "Federal Reserve interest rate treasury bond yield" },
  { id: "finance_macro",     label: "マクロ経済",   icon: "🌐", query: "GDP inflation CPI economic growth" },
  { id: "finance_commodity", label: "コモディティ", icon: "🛢️", query: "crude oil gold commodity price" },
];

function toPickedArticle(
  a: { title: string; link: string; description: string | null; image_url: string | null; language: string; pubDate: string },
  cat: { id: NewsSubcategory; label: string; icon: string },
  suffix: string,
  category: "web3" | "finance"
): PickedArticle {
  const id = hashId(a.link + suffix);
  const isEn = a.language !== "ja";
  return {
    id, externalId: id,
    source: "manual", category,
    titleJa: isEn ? "" : a.title,
    titleEn: isEn ? a.title : "",
    contentJa: isEn ? "" : (a.description ?? ""),
    contentEn: isEn ? (a.description ?? "") : "",
    description: a.description ?? "",
    url: a.link, imageUrl: a.image_url,
    isEnglish: isEn,
    publishedAt: a.pubDate,
    subcategory: cat.id,
    subcategoryLabel: cat.label,
    subcategoryIcon: cat.icon,
  };
}

export async function getWeb3Picks(): Promise<PickedArticle[]> {
  const results = await Promise.allSettled(
    WEB3_SUBCATS.map((cat) => fetchCryptoNews({ query: cat.query, coins: cat.coins }))
  );

  const picks: PickedArticle[] = [];
  const usedUrls = new Set<string>();

  for (let i = 0; i < WEB3_SUBCATS.length; i++) {
    const cat = WEB3_SUBCATS[i];
    const result = results[i];
    if (result.status !== "fulfilled") continue;

    // 重複URLをスキップして最初の新規記事を採用
    const article = result.value.find((a) => !usedUrls.has(a.link));
    if (!article) continue;

    usedUrls.add(article.link);
    picks.push(toPickedArticle(article, cat, "_ndc", "web3"));
  }

  return picks;
}

export async function getFinancePicks(): Promise<PickedArticle[]> {
  const results = await Promise.allSettled(
    FINANCE_SUBCATS.map((cat) => fetchNewsData(cat.query))
  );

  const picks: PickedArticle[] = [];
  const usedUrls = new Set<string>();

  for (let i = 0; i < FINANCE_SUBCATS.length; i++) {
    const cat = FINANCE_SUBCATS[i];
    const result = results[i];
    if (result.status !== "fulfilled") continue;

    const article = result.value.find((a) => !usedUrls.has(a.link));
    if (!article) continue;

    usedUrls.add(article.link);
    picks.push(toPickedArticle(article, cat, "_nd", "finance"));
  }

  return picks;
}
