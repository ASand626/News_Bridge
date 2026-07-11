import type { NewsArticle, NewsCategory, NewsSubcategory, PickedArticle } from "@/types";
import * as NewsApi from "./newsapi";
import * as GNews from "./gnews";
import { fetchCryptoNews, fetchNewsData } from "./newsdata";
import { fetchAtarashiiKeizai, type AkArticle } from "./atarashii-keizai";
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

// キーワードで記事をWeb3サブカテゴリに分類する
const AK_SUBCAT_KEYWORDS: Record<NewsSubcategory, string[]> = {
  web3_defi:       ["defi", "分散型金融", "dex", "流動性", "uniswap", "aave", "compound", "yield", "レンディング", "lending", "amm", "pool"],
  web3_nft:        ["nft", "メタバース", "デジタルアート", "コレクション", "opensea", "mint", "ミント"],
  web3_regulation: ["規制", "法律", "金融庁", "ライセンス", "法案", "sec", "fsa", "法整備", "承認", "禁止", "違法", "制度"],
  web3_stablecoin: ["ステーブルコイン", "stablecoin", "usdt", "usdc", "dai", "cbdc", "デジタル通貨", "ドル建て"],
  web3_infra:      ["ビットコイン", "bitcoin", "btc", "イーサリアム", "ethereum", "eth", "solana", "sol", "レイヤー", "layer", "アップグレード", "ハードフォーク", "ノード", "チェーン"],
  // finance subcats (not used here)
  finance_stock:     [],
  finance_forex:     [],
  finance_bonds:     [],
  finance_macro:     [],
  finance_commodity: [],
};

function detectWeb3Subcat(article: AkArticle): NewsSubcategory {
  const text = (article.title + " " + article.description).toLowerCase();
  for (const cat of WEB3_SUBCATS) {
    const kws = AK_SUBCAT_KEYWORDS[cat.id as NewsSubcategory];
    if (kws.some((kw) => text.includes(kw))) return cat.id as NewsSubcategory;
  }
  return "web3_infra";
}

function akToPickedArticle(
  article: AkArticle,
  cat: { id: NewsSubcategory; label: string; icon: string }
): PickedArticle {
  const id = hashId(article.link + "_ak");
  const pubDate = article.pubDate ? (() => { try { return new Date(article.pubDate).toISOString(); } catch { return new Date().toISOString(); } })() : new Date().toISOString();
  return {
    id, externalId: id,
    source: "manual", category: "web3",
    titleJa: article.title, titleEn: article.title,
    contentJa: article.description, contentEn: article.description,
    description: article.description,
    url: article.link, imageUrl: null,
    isEnglish: false,
    publishedAt: pubDate,
    subcategory: cat.id,
    subcategoryLabel: cat.label,
    subcategoryIcon: cat.icon,
  };
}

async function getWeb3PicksFromRss(): Promise<PickedArticle[]> {
  const articles = await fetchAtarashiiKeizai();
  if (articles.length === 0) return [];

  const picks: PickedArticle[] = [];
  const usedUrls = new Set<string>();

  for (const cat of WEB3_SUBCATS) {
    // キーワードマッチ優先、次に未使用の先頭記事
    const article =
      articles.find((a) => !usedUrls.has(a.link) && detectWeb3Subcat(a) === cat.id) ??
      articles.find((a) => !usedUrls.has(a.link));
    if (!article) continue;
    usedUrls.add(article.link);
    picks.push(akToPickedArticle(article, cat));
  }

  return picks;
}

async function getWeb3PicksFromNewsData(): Promise<PickedArticle[]> {
  const results = await Promise.allSettled(
    WEB3_SUBCATS.map((cat) => fetchCryptoNews({ query: cat.query, coins: cat.coins }))
  );
  const picks: PickedArticle[] = [];
  const usedUrls = new Set<string>();
  for (let i = 0; i < WEB3_SUBCATS.length; i++) {
    const cat = WEB3_SUBCATS[i];
    const result = results[i];
    if (result.status !== "fulfilled") continue;
    const article = result.value.find((a) => !usedUrls.has(a.link));
    if (!article) continue;
    usedUrls.add(article.link);
    picks.push(toPickedArticle(article, cat, "_ndc", "web3"));
  }
  return picks;
}

export async function getWeb3Picks(): Promise<PickedArticle[]> {
  // あたらしい経済 RSSを優先、取得失敗時はNewsData.ioへフォールバック
  const rssPicks = await getWeb3PicksFromRss();
  if (rssPicks.length > 0) return rssPicks;
  return getWeb3PicksFromNewsData();
}

export async function getFinancePicks(): Promise<PickedArticle[]> {
  const results = await Promise.allSettled(
    FINANCE_SUBCATS.map((cat) => fetchNewsData(cat.query, "ja,en"))
  );

  const picks: PickedArticle[] = [];
  const usedUrls = new Set<string>();

  for (let i = 0; i < FINANCE_SUBCATS.length; i++) {
    const cat = FINANCE_SUBCATS[i];
    const result = results[i];
    if (result.status !== "fulfilled") continue;

    const available = result.value.filter((a) => !usedUrls.has(a.link));
    const article = available.find((a) => a.language === "ja") ?? available[0];
    if (!article) continue;

    usedUrls.add(article.link);
    picks.push(toPickedArticle(article, cat, "_nd", "finance"));
  }

  return picks;
}
