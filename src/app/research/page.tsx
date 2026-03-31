"use client";

import { useEffect, useState, useCallback } from "react";
import MainLayout from "@/components/MainLayout";

type ResearchSummary = { id: number; query: string; createdAt: string };
type ResearchFull = { id: number; query: string; content: string; createdAt: string };

export default function ResearchPage() {
  const [history, setHistory] = useState<ResearchSummary[]>([]);
  const [selected, setSelected] = useState<ResearchFull | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/read-later/api/research");
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const loadResearch = async (id: number) => {
    const res = await fetch(`/read-later/api/research/${id}`);
    if (res.ok) setSelected(await res.json());
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setSelected(null);
    try {
      const res = await fetch("/read-later/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: query.trim() }) });
      if (res.ok) { const data = await res.json(); setSelected(data); setQuery(""); fetchHistory(); }
    } catch {}
    setSearching(false);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-3" style={{borderBottom:"1px solid var(--border)"}}>
          <h1 className="text-lg font-semibold mb-3" style={{color:"var(--text-primary)"}}>リサーチ</h1>
          <div className="flex gap-2">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="調べたいことを入力..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
              onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && doSearch()} disabled={searching} />
            <button onClick={doSearch} disabled={searching || !query.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{background:"var(--accent)"}}>{searching ? "..." : "検索"}</button>
          </div>
          <p className="text-xs mt-2" style={{color:"var(--text-muted)"}}>Claudeが最新ニュースを検索し、要約します</p>
        </div>

        {searching && <div className="p-8 text-center animate-pulse" style={{color:"var(--text-muted)"}}>リサーチ中...</div>}

        {selected && !searching && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-1" style={{color:"var(--text-primary)"}}>{selected.query}</h2>
            <p className="text-xs mb-4" style={{color:"var(--text-muted)"}}>{new Date(selected.createdAt).toLocaleString("ja-JP")}</p>
            <div className="prose prose-sm max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--accent)] prose-strong:text-[var(--text-primary)] prose-li:text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: selected.content }} />
          </div>
        )}

        {!selected && !searching && history.length > 0 && (
          <div>
            <p className="px-4 pt-4 text-xs" style={{color:"var(--text-muted)"}}>過去のリサーチ</p>
            {history.map((r) => (
              <button key={r.id} onClick={() => loadResearch(r.id)} className="w-full text-left px-4 py-3 transition-colors hover:bg-[var(--bg-hover)]" style={{borderBottom:"1px solid var(--border)"}}>
                <span className="text-sm font-medium" style={{color:"var(--text-primary)"}}>{r.query}</span>
                <span className="text-xs ml-2" style={{color:"var(--text-muted)"}}>{new Date(r.createdAt).toLocaleDateString("ja-JP")}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
