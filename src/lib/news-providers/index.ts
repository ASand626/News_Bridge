import type { NewsArticle, NewsCategory, NewsSubcategory, PickedArticle } from "@/types";
import * as NewsApi from "./newsapi";
import * as GNews from "./gnews";
import { fetchCryptoNews, fetchNewsData } from "./newsdata";
import { fetchAtarashiiKeizai, type AkArticle } from "./atarashii-keizai";
import { fetchFinanceRss, type FinanceRssArticle } from "./finance-rss";
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
  keywords: string[];
  fallbackQuery?: string; fallbackCoins?: string;
}[] = [
  {
    id: "web3_defi", label: "DeFi", icon: "🔄",
    keywords: ["defi", "分散型金融", "dex", "スワップ", "swap", "流動性", "liquidity",
      "uniswap", "aave", "compound", "yield", "ファーミング", "レンディング", "lending", "amm", "pool", "プール"],
    fallbackQuery: "DeFi protocol", fallbackCoins: "AAVE,UNI,CRV",
  },
  {
    id: "web3_nft", label: "NFT・デジタルアセット", icon: "🎨",
    keywords: ["nft", "メタバース", "metaverse", "デジタルアート", "コレクション",
      "opensea", "mint", "ミント", "gamefi", "ゲーム", "トークン化"],
    fallbackQuery: "NFT marketplace collection",
  },
  {
    id: "web3_regulation", label: "規制・法律", icon: "⚖️",
    keywords: ["規制", "法律", "金融庁", "ライセンス", "法案", "認可", "sec", "fsa",
      "当局", "禁止", "法整備", "法令", "制度", "監督", "compliance", "コンプライアンス"],
    fallbackQuery: "crypto regulation law SEC CFTC",
  },
  {
    id: "web3_stablecoin", label: "ステーブルコイン", icon: "💵",
    keywords: ["ステーブルコイン", "stablecoin", "usdt", "usdc", "dai", "cbdc",
      "デジタル通貨", "デジタル円", "安定通貨", "ペッグ"],
    fallbackCoins: "USDT,USDC,DAI",
  },
  {
    id: "web3_infra", label: "L1・L2インフラ", icon: "⛓️",
    keywords: ["ビットコイン", "bitcoin", "btc", "イーサリアム", "ethereum", "eth",
      "solana", "sol", "レイヤー2", "layer2", "l2", "アップグレード", "スケーリング",
      "ウォレット", "マイニング", "バリデーター", "チェーン", "ノード"],
    fallbackQuery: "blockchain network upgrade", fallbackCoins: "ETH,BTC,SOL",
  },
];

const FINANCE_SUBCATS: {
  id: NewsSubcategory; label: string; icon: string;
  keywords: string[];
  fallbackQuery: string;
}[] = [
  {
    id: "finance_stock", label: "株式市場", icon: "📈",
    keywords: ["株", "日経平均", "東証", "証券", "株価", "株式", "ダウ", "ナスダック",
      "s&p", "nikkei", "配当", "ipo", "上場", "決算", "相場"],
    fallbackQuery: "stock market earnings S&P Nasdaq",
  },
  {
    id: "finance_forex", label: "為替・FX", icon: "💱",
    keywords: ["円安", "円高", "為替", "ドル円", "ユーロ円", "外国為替", "fx",
      "ドル", "ユーロ", "ポンド", "人民元", "円相場"],
    fallbackQuery: "dollar yen euro forex exchange rate",
  },
  {
    id: "finance_bonds", label: "債券・金利", icon: "🏛️",
    keywords: ["金利", "国債", "債券", "日銀", "日本銀行", "利上げ", "利下げ",
      "金融政策", "fed", "フェデラル", "中央銀行", "利率", "利回り", "金融緩和"],
    fallbackQuery: "Federal Reserve interest rate treasury bond yield",
  },
  {
    id: "finance_macro", label: "マクロ経済", icon: "🌐",
    keywords: ["gdp", "インフレ", "物価", "消費者", "景気", "経済成長", "cpi",
      "失業率", "雇用", "貿易", "輸出", "輸入", "経常収支", "財政"],
    fallbackQuery: "GDP inflation CPI economic growth",
  },
  {
    id: "finance_commodity", label: "コモディティ", icon: "🛢️",
    keywords: ["原油", "金価格", "金相場", "石油", "資源", "コモディティ", "天然ガス",
      "小麦", "食料", "エネルギー", "oil", "gold", "commodity"],
    fallbackQuery: "crude oil gold commodity price",
  },
];

// タイトルマッチ3点・説明マッチ1点でスコアリング
function scoreForSubcat(title: string, description: string, keywords: string[]): number {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (t.includes(k)) score += 3;
    else if (d.includes(k)) score += 1;
  }
  return score;
}

// スコアリングで最適割り当て（greedy by score）
function assignToSubcats<T extends { title: string; description: string; link: string }>(
  articles: T[],
  subcats: { id: string; keywords: string[] }[]
): Map<string, T> {
  const pairs: { catId: string; article: T; score: number }[] = [];
  for (const cat of subcats) {
    for (const article of articles) {
      const score = scoreForSubcat(article.title, article.description, cat.keywords);
      pairs.push({ catId: cat.id, article, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const usedCats = new Set<string>();
  const usedUrls = new Set<string>();
  const result = new Map<string, T>();
  for (const { catId, article, score } of pairs) {
    if (score === 0) break;
    if (usedCats.has(catId) || usedUrls.has(article.link)) continue;
    usedCats.add(catId);
    usedUrls.add(article.link);
    result.set(catId, article);
  }
  return result;
}

function toIso(pubDate: string): string {
  try { return new Date(pubDate).toISOString(); } catch { return new Date().toISOString(); }
}

export async function getWeb3Picks(): Promise<PickedArticle[]> {
  // あたらしい経済から前日・当日の全ニュース記事を取得（特集等は除外済み）
  const rssArticles = await fetchAtarashiiKeizai();
  if (rssArticles.length > 0) {
    return rssArticles.map((a) => {
      const id = hashId(a.link + "_ak");
      return {
        id, externalId: id,
        source: "manual", category: "web3",
        titleJa: a.title, titleEn: a.title,
        contentJa: a.description, contentEn: a.description,
        description: a.description,
        url: a.link, imageUrl: null, isEnglish: false,
        publishedAt: toIso(a.pubDate),
      } as PickedArticle;
    });
  }

  // フォールバック: NewsData.io crypto
  const fallback = await fetchCryptoNews({}).catch(() => []);
  return fallback.slice(0, 20).map((a) => {
    const id = hashId(a.link + "_ndc");
    const isEn = a.language !== "ja";
    return {
      id, externalId: id, source: "manual", category: "web3",
      titleJa: isEn ? "" : a.title, titleEn: isEn ? a.title : "",
      contentJa: isEn ? "" : (a.description ?? ""), contentEn: isEn ? (a.description ?? "") : "",
      description: a.description ?? "",
      url: a.link, imageUrl: a.image_url, isEnglish: isEn,
      publishedAt: a.pubDate,
    } as PickedArticle;
  });
}

export async function getFinancePicks(): Promise<PickedArticle[]> {
  const rssArticles = await fetchFinanceRss();
  const assigned = assignToSubcats(rssArticles, FINANCE_SUBCATS);
  const usedUrls = new Set<string>();

  const picks: PickedArticle[] = [];

  for (const cat of FINANCE_SUBCATS) {
    const rss = assigned.get(cat.id);
    if (rss) {
      usedUrls.add(rss.link);
      picks.push({
        id: hashId(rss.link + "_fr"), externalId: hashId(rss.link + "_fr"),
        source: "manual", category: "finance",
        titleJa: rss.title, titleEn: rss.title,
        contentJa: rss.description, contentEn: rss.description,
        description: rss.description,
        url: rss.link, imageUrl: null, isEnglish: false,
        publishedAt: toIso(rss.pubDate),
        subcategory: cat.id, subcategoryLabel: cat.label, subcategoryIcon: cat.icon,
      });
      continue;
    }

    // RSSにマッチなし → NewsData.io でカテゴリー専用取得
    const fallback = await fetchNewsData(cat.fallbackQuery, "ja,en").catch(() => []);
    const available = fallback.filter(a => !usedUrls.has(a.link));
    const fb = available.find(a => a.language === "ja") ?? available[0];
    if (!fb) continue;
    usedUrls.add(fb.link);
    const id = hashId(fb.link + "_nd");
    const isEn = fb.language !== "ja";
    picks.push({
      id, externalId: id, source: "manual", category: "finance",
      titleJa: isEn ? "" : fb.title, titleEn: isEn ? fb.title : "",
      contentJa: isEn ? "" : (fb.description ?? ""), contentEn: isEn ? (fb.description ?? "") : "",
      description: fb.description ?? "",
      url: fb.link, imageUrl: fb.image_url, isEnglish: isEn,
      publishedAt: fb.pubDate,
      subcategory: cat.id, subcategoryLabel: cat.label, subcategoryIcon: cat.icon,
    });
  }

  return picks;
}
