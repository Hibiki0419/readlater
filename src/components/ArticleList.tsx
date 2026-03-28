"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ArticleCard from "./ArticleCard";
import AddArticleForm from "./AddArticleForm";

type Tag = { id: number; name: string; color: string };
type Article = {
  id: number;
  url: string;
  title: string | null;
  domain: string | null;
  content: string | null;
  isRead: boolean;
  isFavorite: boolean;
  createdAt: string;
  tags: { tag: Tag }[];
};

type Response = {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
};

export default function ArticleList() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const tag = searchParams.get("tag") || "";
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(
    async (p: number = 1) => {
      setLoading(true);
      let url = `/read-later/api/articles?filter=${filter}&page=${p}`;
      if (tag) url += `&tag=${encodeURIComponent(tag)}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
      setPage(p);
      setLoading(false);
    },
    [filter, tag]
  );

  useEffect(() => {
    fetchArticles(1);
  }, [fetchArticles]);

  const refresh = () => fetchArticles(page);

  return (
    <div>
      <AddArticleForm onAdded={() => fetchArticles(1)} />

      {loading && !data ? (
        <div className="p-8 text-center text-slate-500">読み込み中...</div>
      ) : data && data.articles.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          記事がありません
        </div>
      ) : (
        <>
          {data?.articles.map((article) => (
            <ArticleCard key={article.id} article={article} onUpdate={refresh} />
          ))}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4">
              <button
                onClick={() => fetchArticles(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm bg-slate-700 rounded disabled:opacity-30 text-slate-300"
              >
                前へ
              </button>
              <span className="px-3 py-1 text-sm text-slate-400">
                {page} / {data.totalPages}
              </span>
              <button
                onClick={() => fetchArticles(page + 1)}
                disabled={page >= data.totalPages}
                className="px-3 py-1 text-sm bg-slate-700 rounded disabled:opacity-30 text-slate-300"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
