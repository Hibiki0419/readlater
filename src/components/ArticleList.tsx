"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ArticleCard from "./ArticleCard";
import MainLayout from "./MainLayout";

type Tag = { id: number; name: string; color: string };
type Article = { id: number; url: string; title: string | null; domain: string | null; content: string | null; memo: string | null; isRead: boolean; isFavorite: boolean; popularity: number; createdAt: string; tags: { tag: Tag }[] };
type DateCount = { date: string; count: number };
type Response = { articles: Article[]; total: number; page: number; totalPages: number; dates: DateCount[] };

export default function ArticleList() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const tag = searchParams.get("tag") || "";
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [dateFilter, setDateFilter] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchArticles = useCallback(async (p: number = 1) => {
    setLoading(true);
    let u = `/read-later/api/articles?filter=${filter}&page=${p}&sort=${sort}`;
    if (tag) u += `&tag=${encodeURIComponent(tag)}`;
    if (dateFilter) u += `&date=${dateFilter}`;
    const res = await fetch(u);
    const json = await res.json();
    setData(json); setPage(p); setLoading(false);
  }, [filter, tag, sort, dateFilter]);

  useEffect(() => { fetchArticles(1); }, [fetchArticles]);
  const refresh = () => fetchArticles(page);

  const addUrl = async () => {
    if (!url.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/read-later/api/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      if (res.ok) { setUrl(""); fetchArticles(1); }
    } catch {}
    setAdding(false);
  };

  return (
    <MainLayout dates={data?.dates} currentDate={dateFilter} onSelectDate={setDateFilter}>
      {/* Combined toolbar: URL input + sort */}
      <div className="sticky top-0 md:top-0 z-[5] px-4 py-3 flex items-center gap-3" style={{background:"var(--bg-card)", borderBottom:"1px solid var(--border)"}}>
        <div className="flex-1 flex gap-2">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URLを追加..."
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
            style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
            onKeyDown={(e) => e.key === "Enter" && addUrl()} disabled={adding} />
          <button onClick={addUrl} disabled={adding || !url.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white shrink-0 disabled:opacity-40"
            style={{background:"var(--accent)"}}>
            {adding ? "..." : "追加"}
          </button>
        </div>
        <div className="flex rounded-lg overflow-hidden shrink-0" style={{background:"var(--bg-elevated)"}}>
          <button onClick={() => setSort("newest")} className="px-3 py-2 text-xs font-medium transition-colors"
            style={{background: sort === "newest" ? "var(--accent)" : "transparent", color: sort === "newest" ? "#252a34" : "var(--text-muted)"}}>新着</button>
          <button onClick={() => setSort("popular")} className="px-3 py-2 text-xs font-medium transition-colors"
            style={{background: sort === "popular" ? "var(--accent)" : "transparent", color: sort === "popular" ? "#252a34" : "var(--text-muted)"}}>注目</button>
        </div>
      </div>

      {dateFilter && (
        <div className="px-4 py-2 flex items-center gap-2" style={{borderBottom:"1px solid var(--border)"}}>
          <span className="text-xs" style={{color:"var(--text-secondary)"}}>{dateFilter}</span>
          <button onClick={() => setDateFilter("")} className="text-xs px-2 py-0.5 rounded" style={{color:"var(--accent)"}}>クリア</button>
        </div>
      )}

      {loading && !data ? (
        <div className="p-12 text-center" style={{color:"var(--text-muted)"}}>読み込み中...</div>
      ) : data && data.articles.length === 0 ? (
        <div className="p-12 text-center" style={{color:"var(--text-muted)"}}>記事がありません</div>
      ) : (
        <>
          {data?.articles.map((article) => (<ArticleCard key={article.id} article={article} onUpdate={refresh} />))}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-3 p-5">
              <button onClick={() => fetchArticles(page - 1)} disabled={page <= 1} className="px-4 py-2.5 text-sm rounded-xl disabled:opacity-30" style={{background:"var(--bg-elevated)", color:"var(--text-secondary)"}}>前へ</button>
              <span className="px-4 py-2.5 text-sm" style={{color:"var(--text-muted)"}}>{page} / {data.totalPages}</span>
              <button onClick={() => fetchArticles(page + 1)} disabled={page >= data.totalPages} className="px-4 py-2.5 text-sm rounded-xl disabled:opacity-30" style={{background:"var(--bg-elevated)", color:"var(--text-secondary)"}}>次へ</button>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
