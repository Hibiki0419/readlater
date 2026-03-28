"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Article = {
  id: number;
  url: string;
  title: string | null;
  domain: string | null;
  content: string | null;
  excerpt: string | null;
  createdAt: string;
  tags: { tag: { id: number; name: string; color: string } }[];
};

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/read-later/api/articles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setArticle(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">読み込み中...</div>;
  }

  if (!article) {
    return <div className="p-8 text-center text-slate-500">記事が見つかりません</div>;
  }

  return (
    <main className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-slate-400 hover:text-slate-200 text-lg"
        >
          ←
        </button>
        <h1 className="text-sm font-medium text-slate-300 truncate flex-1">
          {article.domain}
        </h1>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 text-sm hover:text-sky-300"
        >
          元記事
        </a>
      </header>

      <article className="p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          {article.title || "無題"}
        </h1>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        {article.content ? (
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-slate-200 prose-p:text-slate-300
              prose-a:text-sky-400 prose-strong:text-slate-200
              prose-img:rounded-lg prose-img:max-w-full"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <div className="text-slate-500 text-center py-12">
            <p>本文を取得できませんでした</p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sky-400 hover:text-sky-300 text-sm"
            >
              元の記事を開く →
            </a>
          </div>
        )}
      </article>
    </main>
  );
}
