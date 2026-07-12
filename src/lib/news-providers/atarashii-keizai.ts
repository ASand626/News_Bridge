const FEED_URL = "https://www.neweconomy.jp/feed/";

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

// 除外カテゴリー・タイトルキーワード（特集・コラム・PR等）
const EXCLUDE_CATS = ["特集", "コラム", "連載", "pr", "プレスリリース", "広告", "sponsored", "opinion"];
const EXCLUDE_TITLE_PREFIXES = ["【特集】", "【PR】", "【広告】", "【コラム】", "【連載】", "[PR]", "PR：", "AD："];

function isNewsArticle(a: AkArticle): boolean {
  const catLower = a.categories.map(c => c.toLowerCase());
  if (EXCLUDE_CATS.some(ex => catLower.includes(ex))) return false;
  if (EXCLUDE_TITLE_PREFIXES.some(kw => a.title.startsWith(kw))) return false;
  return true;
}

// 前日00:00 JST（≒ UTC 48h前）以降の記事
function isWithin48Hours(pubDate: string): boolean {
  try {
    // JSTで前日0時 = UTC換算で now - 48h が安全なマージン
    return new Date(pubDate) >= new Date(Date.now() - 48 * 60 * 60 * 1000);
  } catch {
    return false;
  }
}

export async function fetchAtarashiiKeizai(): Promise<AkArticle[]> {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBridge/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const all = parseItems(xml).filter(isNewsArticle);
    const recent = all.filter(a => isWithin48Hours(a.pubDate));
    // 48時間内が少なすぎる場合は最新10件にフォールバック
    return recent.length >= 3 ? recent : all.slice(0, 10);
  } catch {
    return [];
  }
}
