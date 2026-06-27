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
