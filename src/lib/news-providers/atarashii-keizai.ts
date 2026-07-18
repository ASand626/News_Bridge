const AK_FEED_URL = "https://www.neweconomy.jp/feed/";

export interface AkArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
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

function extractCategories(block: string): string[] {
  const cats: string[] = [];
  for (const m of block.matchAll(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi)) {
    const cat = m[1].trim();
    if (cat) cats.push(cat);
  }
  return cats;
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

function parseItems(xml: string): AkArticle[] {
  const items: AkArticle[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const title = stripHtml(extractTag(b, "title"));
    const link = extractLink(b);
    const description = stripHtml(extractTag(b, "description"));
    const pubDate = extractTag(b, "pubDate");
    const categories = extractCategories(b);
    if (title && link) items.push({ title, link, description, pubDate, categories });
  }
  return items;
}

const EXCLUDE_CATS = ["特集", "コラム", "連載", "pr", "プレスリリース", "広告", "sponsored", "opinion"];
const EXCLUDE_TITLE_PREFIXES = ["【特集】", "【PR】", "【広告】", "【コラム】", "【連載】", "[PR]", "PR：", "AD："];

function isNewsArticle(a: AkArticle): boolean {
  const catLower = a.categories.map(c => c.toLowerCase());
  if (EXCLUDE_CATS.some(ex => catLower.includes(ex))) return false;
  if (EXCLUDE_TITLE_PREFIXES.some(kw => a.title.startsWith(kw))) return false;
  return true;
}

function isWithin48Hours(pubDate: string): boolean {
  try {
    return new Date(pubDate) >= new Date(Date.now() - 48 * 60 * 60 * 1000);
  } catch {
    return false;
  }
}

async function fetchFeed(url: string): Promise<AkArticle[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBridge/1.0)" },
    });
    if (!res.ok) return [];
    return parseItems(await res.text());
  } catch {
    return [];
  }
}

export async function fetchAtarashiiKeizai(): Promise<AkArticle[]> {
  // 1ページ目だけだと直近10件程度で当日分しか残らないことがあるため、
  // 前日分を確保するために2ページ目も合わせて取得する
  const [page1, page2] = await Promise.allSettled([
    fetchFeed(AK_FEED_URL),
    fetchFeed(`${AK_FEED_URL}?paged=2`),
  ]);

  const seen = new Set<string>();
  const items: AkArticle[] = [];
  for (const result of [page1, page2]) {
    if (result.status !== "fulfilled") continue;
    for (const a of result.value.filter(isNewsArticle)) {
      if (!seen.has(a.link)) {
        seen.add(a.link);
        items.push(a);
      }
    }
  }

  // 新しい順に並べて 48h フィルター
  items.sort((a, b) => {
    try { return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(); } catch { return 0; }
  });

  return items.filter(a => isWithin48Hours(a.pubDate));
}
