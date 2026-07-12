const FEED_URL = "https://www.neweconomy.jp/feed/";

export interface AkArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function extractTag(block: string, tag: string): string {
  // CDATA
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i")
  );
  if (cdata) return cdata[1].trim();
  // plain text
  const plain = block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i"));
  return plain ? plain[1].trim() : "";
}

function extractLink(block: string): string {
  // <link>URL</link>
  const rss2 = block.match(/<link>([\s\S]*?)<\/link>/i);
  if (rss2) return rss2[1].trim();
  // <guid isPermaLink="true">URL</guid>
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

function parseItems(xml: string): AkArticle[] {
  const items: AkArticle[] = [];
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

export async function fetchAtarashiiKeizai(): Promise<AkArticle[]> {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: 43200 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBridge/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml);
  } catch {
    return [];
  }
}
