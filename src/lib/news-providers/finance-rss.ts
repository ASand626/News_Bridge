const NHK_ECONOMY_URL = "https://www.nhk.or.jp/rss/news/cat5.xml";
const REUTERS_JP_URL = "https://feeds.reuters.com/reuters/JPBusinessNews";

export interface FinanceRssArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function extractTag(block: string, tag: string): string {
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i")
  );
  if (cdata) return cdata[1].trim();
  const plain = block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i"));
  return plain ? plain[1].trim() : "";
}

function extractLink(block: string): string {
  const rss2 = block.match(/<link>([\s\S]*?)<\/link>/i);
  if (rss2) return rss2[1].trim();
  const guid = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
  return guid ? guid[1].trim() : "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseItems(xml: string): FinanceRssArticle[] {
  const items: FinanceRssArticle[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const title = stripHtml(extractTag(b, "title"));
    const link = extractLink(b);
    const description = stripHtml(extractTag(b, "description"));
    const pubDate = extractTag(b, "pubDate");
    if (title && link) items.push({ title, link, description, pubDate });
  }
  return items;
}

async function fetchRss(url: string): Promise<FinanceRssArticle[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBridge/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml);
  } catch {
    return [];
  }
}

export async function fetchFinanceRss(): Promise<FinanceRssArticle[]> {
  const [nhk, reuters] = await Promise.allSettled([
    fetchRss(NHK_ECONOMY_URL),
    fetchRss(REUTERS_JP_URL),
  ]);

  const seen = new Set<string>();
  const articles: FinanceRssArticle[] = [];

  for (const result of [nhk, reuters]) {
    if (result.status !== "fulfilled") continue;
    for (const a of result.value) {
      if (!seen.has(a.link)) {
        seen.add(a.link);
        articles.push(a);
      }
    }
  }

  return articles;
}
