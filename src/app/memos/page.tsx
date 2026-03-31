"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";

type Article = { id: number; title: string | null; url: string; memo: string; domain: string | null; createdAt: string };

export default function MemosPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/read-later/api/articles?filter=all&hasMemo=true")
      .then(r => r.json())
      .then(data => { setArticles(data.articles || []); setLoading(false); });
  }, []);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-3" style={{borderBottom:"1px solid var(--border)"}}>
          <h1 className="text-lg font-semibold" style={{color:"var(--text-primary)"}}>メモ一覧</h1>
        </div>
        {loading ? (
          <div className="p-8 text-center" style={{color:"var(--text-muted)"}}>読み込み中...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center" style={{color:"var(--text-muted)"}}>メモ付きの記事がありません</div>
        ) : (
          <div>
            {articles.map((a) => (
              <div key={a.id} className="p-4" style={{borderBottom:"1px solid var(--border)"}}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium transition-colors hover:opacity-70" style={{color:"var(--text-primary)"}}>{a.title || a.url}</a>
                <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>{a.domain}</p>
                <p className="mt-2 text-sm px-3 py-2 rounded-lg whitespace-pre-wrap" style={{background:"var(--bg-elevated)", color:"var(--text-secondary)"}}>{a.memo}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
