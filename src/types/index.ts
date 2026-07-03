export type NewsCategory = "ai" | "web3" | "finance" | "economy" | "tech";

export type NewsSubcategory =
  | "web3_defi" | "web3_infra" | "web3_nft" | "web3_regulation" | "web3_stablecoin"
  | "finance_stock" | "finance_forex" | "finance_bonds" | "finance_macro" | "finance_commodity";

export interface PickedArticle extends NewsArticle {
  subcategory: NewsSubcategory;
  subcategoryLabel: string;
  subcategoryIcon: string;
}
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
  language?: "ja" | "en";
}

export interface Translation {
  titleJa: string;
  contentJa: string;
  contentEn?: string;
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

export interface BookmarkedArticle {
  id: string;
  title: string;
  url?: string;
  bookmarkedAt: string;
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
