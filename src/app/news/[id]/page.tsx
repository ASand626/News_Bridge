import { ArticleDetailClient } from "@/features/news/components/ArticleDetailClient";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleDetailClient id={id} />;
}
