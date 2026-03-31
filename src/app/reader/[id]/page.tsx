"use client";

import { useEffect, useState, use } from "react";
import MainLayout from "@/components/MainLayout";

type Article = { id: number; url: string; title: string | null; domain: string | null; content: string | null; excerpt: string | null; createdAt: string; tags: { tag: { id: number; name: string; color: string } }[] };

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/read-later/api/articles/${id}`).then(r => r.json()).then(data => { setArticle(data); setLoading(false); });
  }, [id]);

  if (loading) return <MainLayout><div className="p-8 text-center" style={{color:"var(--text-muted)"}}>読み込み中...</div></MainLayout>;
  if (!article) return <MainLayout><div className="p-8 text-center" style={{color:"var(--text-muted)"}}>記事が見つかりません</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:"1px solid var(--border)"}}>
          <span className="text-sm font-medium truncate" style={{color:"var(--text-secondary)"}}>{article.domain}</span>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm shrink-0" style={{color:"var(--accent)"}}>元記事</a>
        </div>
        <article className="p-6">
          <h1 className="text-2xl font-bold mb-2" style={{color:"var(--text-primary)"}}>{article.title || "無題"}</h1>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {article.tags.map(({ tag }) => (
                <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
              ))}
            </div>
          )}
          {article.content ? (
            <div className="prose prose-sm max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--accent)] prose-strong:text-[var(--text-primary)] prose-img:rounded-lg prose-img:max-w-full"
              dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : (
            <div className="text-center py-12" style={{color:"var(--text-muted)"}}>
              <p>本文を取得できませんでした</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm" style={{color:"var(--accent)"}}>元の記事を開く</a>
            </div>
          )}
        </article>
      </div>
    </MainLayout>
  );
}
