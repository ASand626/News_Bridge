export interface NewsDataArticle {
  title: string;
  link: string;
  description: string | null;
  content: string | null;
  pubDate: string;
  image_url: string | null;
  source_id: string;
  language: string;
}

async function fetchNewsDataEndpoint(
  endpoint: string,
  params: Record<string, string>
): Promise<NewsDataArticle[]> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return [];

  const url = new URL(`https://newsdata.io/api/1/${endpoint}`);
  url.searchParams.set("apikey", key);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).filter((a: NewsDataArticle) => a.title && a.link);
  } catch { return []; }
}

// 金融ニュース取得（/api/1/news - business/topカテゴリ）
export function fetchNewsData(query: string, language = "ja,en"): Promise<NewsDataArticle[]> {
  return fetchNewsDataEndpoint("news", { q: query, language, category: "business,top" });
}

// 暗号資産ニュース取得（/api/1/crypto - crypto専用エンドポイント）
export function fetchCryptoNews(options: {
  query?: string;
  coins?: string;   // カンマ区切りのコインシンボル例: "BTC,ETH"（無料枠は最大5コイン）
  language?: string;
}): Promise<NewsDataArticle[]> {
  return fetchNewsDataEndpoint("crypto", {
    ...(options.query  ? { q: options.query }       : {}),
    ...(options.coins  ? { coin: options.coins }    : {}),
    ...(options.language ? { language: options.language } : { language: "en" }),
  });
}
