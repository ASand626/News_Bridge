import type { NewsArticle, NewsCategory, PickedArticle } from "@/types";
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

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function filterRecent<T extends { pubDate: string }>(items: T[], minCount = 3, max = 20): T[] {
  const cutoff = new Date(Date.now() - TWELVE_HOURS);
  const recent = items.filter((a) => {
    try { return new Date(a.pubDate) >= cutoff; } catch { return false; }
  });
  return (recent.length >= minCount ? recent : items).slice(0, max);
}

function akToPickedArticle(article: AkArticle): PickedArticle {
  const id = hashId(article.link + "_ak");
  const pubDate = article.pubDate
    ? (() => { try { return new Date(article.pubDate).toISOString(); } catch { return new Date().toISOString(); } })()
    : new Date().toISOString();
  return {
    id, externalId: id,
    source: "manual", category: "web3",
    titleJa: article.title, titleEn: article.title,
    contentJa: article.description, contentEn: article.description,
    description: article.description,
    url: article.link, imageUrl: null,
    isEnglish: false,
    publishedAt: pubDate,
  };
}

function financeRssToPickedArticle(article: FinanceRssArticle): PickedArticle {
  const id = hashId(article.link + "_fr");
  const pubDate = article.pubDate
    ? (() => { try { return new Date(article.pubDate).toISOString(); } catch { return new Date().toISOString(); } })()
    : new Date().toISOString();
  return {
    id, externalId: id,
    source: "manual", category: "finance",
    titleJa: article.title, titleEn: article.title,
    contentJa: article.description, contentEn: article.description,
    description: article.description,
    url: article.link, imageUrl: null,
    isEnglish: false,
    publishedAt: pubDate,
  };
}

export async function getWeb3Picks(): Promise<PickedArticle[]> {
  const articles = await fetchAtarashiiKeizai();
  if (articles.length > 0) return filterRecent(articles).map(akToPickedArticle);

  // フォールバック: NewsData.io crypto
  const fallback = await fetchCryptoNews({}).catch(() => []);
  return fallback.slice(0, 20).map((a) => {
    const id = hashId(a.link + "_ndc");
    const isEn = a.language !== "ja";
    return {
      id, externalId: id,
      source: "manual", category: "web3",
      titleJa: isEn ? "" : a.title, titleEn: isEn ? a.title : "",
      contentJa: isEn ? "" : (a.description ?? ""), contentEn: isEn ? (a.description ?? "") : "",
      description: a.description ?? "",
      url: a.link, imageUrl: a.image_url,
      isEnglish: isEn,
      publishedAt: a.pubDate,
    } as PickedArticle;
  });
}

export async function getFinancePicks(): Promise<PickedArticle[]> {
  const articles = await fetchFinanceRss();
  if (articles.length > 0) return filterRecent(articles).map(financeRssToPickedArticle);

  // フォールバック: NewsData.io
  const fallback = await fetchNewsData("finance economy stock market", "ja,en").catch(() => []);
  return fallback.slice(0, 20).map((a) => {
    const id = hashId(a.link + "_nd");
    const isEn = a.language !== "ja";
    return {
      id, externalId: id,
      source: "manual", category: "finance",
      titleJa: isEn ? "" : a.title, titleEn: isEn ? a.title : "",
      contentJa: isEn ? "" : (a.description ?? ""), contentEn: isEn ? (a.description ?? "") : "",
      description: a.description ?? "",
      url: a.link, imageUrl: a.image_url,
      isEnglish: isEn,
      publishedAt: a.pubDate,
    } as PickedArticle;
  });
}
