export type NewsCategory = "ai" | "web3" | "finance" | "economy" | "tech";
export type Language = "ja" | "en";

export interface TermFavorite {
  id: string;
  term: string;
  shortDesc: string;
  detailDesc: string;
  examples: string[];
  relatedTerms: string[];
  whyImportant: string;
  category: string;
  createdAt: string;
}

export interface FavoriteSite {
  id: string;
  name: string;
  url: string;
}

export interface ArticleHistoryItem {
  id: string;
  title: string;
  url?: string;
  savedAt: string;
}

export interface NewsArticle {
  id: string;
  externalId: string;
  source: "newsapi" | "gnews" | "manual";
  category: NewsCategory | null;
  titleJa: string;
  titleEn: string;
  contentJa: string;
  contentEn: string;
  description: string;
  url: string;
  imageUrl: string | null;
  isEnglish: boolean;
  publishedAt: string;
}

export type ImpactCategory = "world" | "japan" | "investment" | "web3" | "life" | "tech";

export interface ImpactCard {
  icon: string;
  title: string;
  content: string;
  category: ImpactCategory;
}

export interface AIExplanation {
  articleId: string;
  summary: string;
  background: string;
  causalChainMmd: string;
  causalChainText: string;
  impactCards: ImpactCard[];
  modelVersion: string;
  createdAt: string;
}

export interface ExplanationState {
  summary: string | null;
  background: string | null;
  causalChainMmd: string | null;
  causalChainText: string | null;
  impactCards: ImpactCard[] | null;
  loading: boolean;
  done: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
