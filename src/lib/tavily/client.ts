import { tavily } from "@tavily/core";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export async function searchRelated(query: string): Promise<string> {
  try {
    const res = await client.search(query, { maxResults: 3, searchDepth: "basic" });
    return res.results
      .map((r) => `タイトル: ${r.title}\n内容: ${r.content}\nURL: ${r.url}`)
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}

export async function extractArticleContent(url: string): Promise<string> {
  try {
    const res = await client.extract([url]);
    const raw = res.results[0]?.rawContent ?? "";
    // 長すぎる場合は8000文字に制限
    return raw.slice(0, 8000);
  } catch {
    return "";
  }
}
