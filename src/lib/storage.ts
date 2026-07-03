import { supabase } from "@/lib/supabase/client";
import type { NewsArticle, FavoriteSite, ArticleHistoryItem, TermFavorite, BookmarkedArticle, Translation } from "@/types";

// ── Auth helper ───────────────────────────────────────────────────────────────
// ログイン中ユーザーのIDを返す。未ログインはnull
async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Article ───────────────────────────────────────────────────────────────────

export async function saveArticle(article: NewsArticle) {
  // localStorage（即時）
  try { localStorage.setItem(`nb_article_${article.id}`, JSON.stringify(article)); } catch {}

  // Supabase（非同期・fire-and-forget）
  if (supabase) {
    supabase.from("articles").upsert({
      id: article.id,
      title: article.titleJa || article.titleEn,
      url: article.url || null,
      content: article.contentJa || article.contentEn,
      image_url: article.imageUrl,
      is_english: article.isEnglish,
      source: article.source,
      published_at: article.publishedAt,
    }).then(({ error }) => { if (error) console.error("[supabase] saveArticle:", error.message); });
  }
}

export async function loadArticle(id: string): Promise<NewsArticle | null> {
  // localStorage（高速パス）
  try {
    const raw = localStorage.getItem(`nb_article_${id}`);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Supabaseフォールバック
  if (supabase) {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;

    const article: NewsArticle = {
      id: data.id,
      externalId: data.id,
      source: data.source as NewsArticle["source"],
      category: null,
      titleJa: data.is_english ? "" : data.title,
      titleEn: data.is_english ? data.title : "",
      contentJa: data.is_english ? "" : data.content,
      contentEn: data.is_english ? data.content : "",
      description: data.content.slice(0, 200),
      url: data.url ?? "",
      imageUrl: data.image_url,
      isEnglish: data.is_english,
      publishedAt: data.published_at,
    };
    // ローカルに書き戻し
    try { localStorage.setItem(`nb_article_${id}`, JSON.stringify(article)); } catch {}
    return article;
  }

  return null;
}

// ── Explanation cache ─────────────────────────────────────────────────────────

export async function saveExplanation(articleId: string, raw: string) {
  const key = `nb_exp_${articleId}`;
  try { localStorage.setItem(key, JSON.stringify({ __raw: raw })); } catch {}

  if (supabase) {
    supabase.from("explanations").upsert({ article_id: articleId, raw })
      .then(({ error }) => { if (error) console.error("[supabase] saveExplanation:", error.message); });
  }
}

export async function loadExplanation(articleId: string): Promise<string | null> {
  // localStorage
  try {
    const raw = localStorage.getItem(`nb_exp_${articleId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.__raw as string;
    }
  } catch {}

  // Supabase
  if (supabase) {
    const { data, error } = await supabase
      .from("explanations")
      .select("raw")
      .eq("article_id", articleId)
      .single();
    if (error || !data) return null;
    try { localStorage.setItem(`nb_exp_${articleId}`, JSON.stringify({ __raw: data.raw })); } catch {}
    return data.raw;
  }

  return null;
}

// ── History ───────────────────────────────────────────────────────────────────

export async function addToHistory(item: ArticleHistoryItem) {
  // localStorage
  const local = getHistoryLocal().filter((h) => h.id !== item.id);
  local.unshift(item);
  try { localStorage.setItem("nb_history", JSON.stringify(local.slice(0, 50))); } catch {}

  // Supabase upsert（ログイン時のみ）
  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("history").upsert({
      article_id: item.id,
      title: item.title,
      url: item.url ?? null,
      saved_at: item.savedAt,
      user_id: uid,
    }, { onConflict: "article_id,user_id" })
      .then(({ error }) => { if (error) console.error("[supabase] addToHistory:", error.message); });
  }
}

export async function getHistory(): Promise<ArticleHistoryItem[]> {
  // Supabase（ログイン時のみ・RLSが自動的にuser_idでフィルタ）
  const uid = await getUserId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from("history")
      .select("article_id, title, url, saved_at")
      .order("saved_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      const items = data.map((r) => ({ id: r.article_id, title: r.title, url: r.url ?? undefined, savedAt: r.saved_at }));
      try { localStorage.setItem("nb_history", JSON.stringify(items)); } catch {}
      return items;
    }
  }
  // fallback
  return getHistoryLocal();
}

export async function removeFromHistory(id: string) {
  // localStorage
  try {
    localStorage.setItem("nb_history", JSON.stringify(getHistoryLocal().filter((h) => h.id !== id)));
  } catch {}
  // Supabase（RLSが自動的に自分のデータのみ削除）
  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("history").delete().eq("article_id", id)
      .then(({ error }) => { if (error) console.error("[supabase] removeFromHistory:", error.message); });
  }
}

function getHistoryLocal(): ArticleHistoryItem[] {
  try {
    const raw = localStorage.getItem("nb_history");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Favorite Sites ────────────────────────────────────────────────────────────

const DEFAULT_SITES: FavoriteSite[] = [
  { id: "nhk",       name: "NHKニュース",      url: "https://www3.nhk.or.jp/news/" },
  { id: "nikkei",    name: "日本経済新聞",      url: "https://www.nikkei.com/" },
  { id: "techcrunch", name: "TechCrunch Japan", url: "https://jp.techcrunch.com/" },
];

// favorite_sitesはidが短い文字列（"nhk"等）のため複数ユーザーが使う場合にPK競合しないようuserプレフィックスを付与
function toDbSiteId(uid: string, siteId: string) { return `${uid.slice(0, 8)}_${siteId}`; }
function fromDbSiteId(dbId: string) { return dbId.replace(/^[0-9a-f]{8}_/, ""); }

export async function getSites(): Promise<FavoriteSite[]> {
  const uid = await getUserId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from("favorite_sites")
      .select("id, name, url")
      .order("sort_order", { ascending: true });
    if (!error && data && data.length > 0) {
      const sites = data.map((r) => ({ id: fromDbSiteId(r.id), name: r.name, url: r.url }));
      try { localStorage.setItem("nb_sites", JSON.stringify(sites)); } catch {}
      return sites;
    }
  }
  // fallback
  try {
    const raw = localStorage.getItem("nb_sites");
    return raw ? JSON.parse(raw) : DEFAULT_SITES;
  } catch { return DEFAULT_SITES; }
}

export async function saveSites(sites: FavoriteSite[]) {
  try { localStorage.setItem("nb_sites", JSON.stringify(sites)); } catch {}

  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("favorite_sites").delete().neq("id", "").then(async ({ error: delErr }) => {
      if (delErr) { console.error("[supabase] saveSites delete:", delErr.message); return; }
      if (sites.length === 0) return;
      const rows = sites.map((s, i) => ({
        id: toDbSiteId(uid, s.id), name: s.name, url: s.url, sort_order: i, user_id: uid,
      }));
      const { error: insErr } = await supabase!.from("favorite_sites").insert(rows);
      if (insErr) console.error("[supabase] saveSites insert:", insErr.message);
    });
  }
}

// ── Chat Messages ─────────────────────────────────────────────────────────────

export type ChatMsg = { id: string; role: "user" | "assistant"; content: string };

export async function loadChatMessages(articleId: string): Promise<ChatMsg[]> {
  // localStorage（高速パス）
  try {
    const raw = localStorage.getItem(`nb_chat_${articleId}`);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Supabase（ログイン時のみ・RLSが自動フィルタ）
  const uid = await getUserId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });
    if (!error && data && data.length > 0) {
      const msgs = data as ChatMsg[];
      try { localStorage.setItem(`nb_chat_${articleId}`, JSON.stringify(msgs)); } catch {}
      return msgs;
    }
  }
  return [];
}

export async function saveChatMessage(articleId: string, msg: ChatMsg, allMessages: ChatMsg[]) {
  // localStorage（全件更新）
  try { localStorage.setItem(`nb_chat_${articleId}`, JSON.stringify(allMessages)); } catch {}

  // Supabase（ログイン時のみ）
  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("chat_messages")
      .insert({ id: msg.id, article_id: articleId, role: msg.role, content: msg.content, user_id: uid })
      .then(({ error }) => { if (error) console.error("[supabase] saveChatMessage:", error.message); });
  }
}

// ── Translation cache ─────────────────────────────────────────────────────────

export async function saveTranslation(articleId: string, data: Translation) {
  try { localStorage.setItem(`nb_trans_${articleId}`, JSON.stringify(data)); } catch {}

  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("translations").upsert({
      article_id: articleId,
      title_ja: data.titleJa,
      content_ja: data.contentJa,
    }, { onConflict: "article_id" })
      .then(({ error }) => { if (error) console.error("[supabase] saveTranslation:", error.message); });
  }
}

export async function loadTranslation(articleId: string): Promise<Translation | null> {
  try {
    const raw = localStorage.getItem(`nb_trans_${articleId}`);
    if (raw) return JSON.parse(raw);
  } catch {}

  if (supabase) {
    const { data, error } = await supabase
      .from("translations")
      .select("title_ja, content_ja")
      .eq("article_id", articleId)
      .single();
    if (!error && data) {
      const t: Translation = { titleJa: data.title_ja, contentJa: data.content_ja };
      try { localStorage.setItem(`nb_trans_${articleId}`, JSON.stringify(t)); } catch {}
      return t;
    }
  }

  return null;
}

// ── Term Favorites ────────────────────────────────────────────────────────────

function termLocalKey(lang: "ja" | "en") {
  return lang === "en" ? "nb_term_favs_en" : "nb_term_favs";
}

export async function getFavoriteTerms(lang: "ja" | "en" = "ja"): Promise<TermFavorite[]> {
  const uid = await getUserId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from("term_favorites")
      .select("*")
      .eq("language", lang)
      .order("created_at", { ascending: false });
    if (!error && data) {
      const terms = data.map((r) => ({
        id: r.id, term: r.term,
        shortDesc: r.short_desc, detailDesc: r.detail_desc,
        examples: r.examples ?? [], relatedTerms: r.related_terms ?? [],
        whyImportant: r.why_important, category: r.category,
        createdAt: r.created_at, language: (r.language ?? "ja") as "ja" | "en",
      }));
      try { localStorage.setItem(termLocalKey(lang), JSON.stringify(terms)); } catch {}
      return terms;
    }
  }
  try {
    const raw = localStorage.getItem(termLocalKey(lang));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveFavoriteTerm(t: Omit<TermFavorite, "id" | "createdAt">) {
  const lang = t.language ?? "ja";
  const entry: TermFavorite = { ...t, language: lang, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const all = await getFavoriteTerms(lang);
  const updated = [entry, ...all.filter((x) => x.term !== t.term)];
  try { localStorage.setItem(termLocalKey(lang), JSON.stringify(updated)); } catch {}
  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("term_favorites").upsert({
      term: t.term, short_desc: t.shortDesc, detail_desc: t.detailDesc,
      examples: t.examples, related_terms: t.relatedTerms,
      why_important: t.whyImportant, category: t.category, user_id: uid, language: lang,
    }, { onConflict: "term,user_id,language" })
      .then(({ error }) => { if (error) console.error("[supabase] saveFavoriteTerm:", error.message); });
  }
}

export async function removeFavoriteTerm(term: string, lang: "ja" | "en" = "ja") {
  const all = await getFavoriteTerms(lang);
  const updated = all.filter((x) => x.term !== term);
  try { localStorage.setItem(termLocalKey(lang), JSON.stringify(updated)); } catch {}
  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("term_favorites").delete().eq("term", term).eq("language", lang)
      .then(({ error }) => { if (error) console.error("[supabase] removeFavoriteTerm:", error.message); });
  }
}

export async function isFavoriteTerm(term: string, lang: "ja" | "en" = "ja"): Promise<boolean> {
  const all = await getFavoriteTerms(lang);
  return all.some((x) => x.term === term);
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────

function getBookmarksLocal(): BookmarkedArticle[] {
  try {
    const raw = localStorage.getItem("nb_bookmarks");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addBookmark(article: NewsArticle) {
  const item: BookmarkedArticle = {
    id: article.id,
    title: article.titleJa || article.titleEn,
    url: article.url || undefined,
    bookmarkedAt: new Date().toISOString(),
  };
  const local = getBookmarksLocal().filter((b) => b.id !== article.id);
  local.unshift(item);
  try { localStorage.setItem("nb_bookmarks", JSON.stringify(local)); } catch {}

  const uid = await getUserId();
  if (supabase && uid) {
    // 記事本体をSupabaseに永続化（元記事が消えても解説を保持するため）
    saveArticle(article);
    supabase.from("article_bookmarks").upsert({
      article_id: article.id,
      user_id: uid,
      title: item.title,
      url: item.url ?? null,
    }, { onConflict: "article_id,user_id" })
      .then(({ error }) => { if (error) console.error("[supabase] addBookmark:", error.message); });
  }
}

export async function removeBookmark(articleId: string) {
  try {
    localStorage.setItem("nb_bookmarks", JSON.stringify(
      getBookmarksLocal().filter((b) => b.id !== articleId)
    ));
  } catch {}
  const uid = await getUserId();
  if (supabase && uid) {
    supabase.from("article_bookmarks").delete()
      .eq("article_id", articleId).eq("user_id", uid)
      .then(({ error }) => { if (error) console.error("[supabase] removeBookmark:", error.message); });
  }
}

export async function getBookmarks(): Promise<BookmarkedArticle[]> {
  const uid = await getUserId();
  if (supabase && uid) {
    const { data, error } = await supabase
      .from("article_bookmarks")
      .select("article_id, title, url, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data && data.length > 0) {
      const items: BookmarkedArticle[] = data.map((r) => ({
        id: r.article_id as string,
        title: r.title as string,
        url: (r.url as string | null) ?? undefined,
        bookmarkedAt: r.created_at as string,
      }));
      try { localStorage.setItem("nb_bookmarks", JSON.stringify(items)); } catch {}
      return items;
    }
  }
  return getBookmarksLocal();
}

// isBookmarked はローカルのみ参照（非同期不要・高速）
export function isBookmarkedLocal(articleId: string): boolean {
  return getBookmarksLocal().some((b) => b.id === articleId);
}

// ── ID generation ─────────────────────────────────────────────────────────────

export async function hashUrl(url: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
