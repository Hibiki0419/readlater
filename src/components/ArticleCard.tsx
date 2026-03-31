"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import TagBadge from "./TagBadge";
import TagManager from "./TagManager";

type Tag = { id: number; name: string; color: string };
type Article = { id: number; url: string; title: string | null; domain: string | null; content: string | null; memo: string | null; isRead: boolean; isFavorite: boolean; popularity: number; createdAt: string; tags: { tag: Tag }[] };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m + "分前";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "時間前";
  return Math.floor(h / 24) + "日前";
}

function fmtPop(n: number): string { return n >= 1000 ? (n/1000).toFixed(1) + "k" : String(n); }

export default function ArticleCard({ article, onUpdate }: { article: Article; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showReadPrompt, setShowReadPrompt] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [memo, setMemo] = useState(article.memo || "");
  const clickedRef = useRef(false);

  const handleVis = useCallback(() => { if (document.visibilityState === "visible" && clickedRef.current) { clickedRef.current = false; setShowReadPrompt(true); } }, []);
  useEffect(() => { document.addEventListener("visibilitychange", handleVis); return () => document.removeEventListener("visibilitychange", handleVis); }, [handleVis]);

  const handleLinkClick = () => { if (!article.isRead) clickedRef.current = true; };
  const markRead = async () => { setShowReadPrompt(false); setLoading(true); await fetch(`/read-later/api/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }) }); onUpdate(); setLoading(false); };
  const toggle = async (field: "isRead" | "isFavorite") => { setLoading(true); await fetch(`/read-later/api/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: !article[field] }) }); onUpdate(); setLoading(false); };
  const remove = async () => { if (!confirm("削除しますか？")) return; await fetch(`/read-later/api/articles/${article.id}`, { method: "DELETE" }); onUpdate(); };
  const saveMemo = async () => { await fetch(`/read-later/api/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memo: memo || null }) }); setShowMemo(false); onUpdate(); };

  return (
    <div className={`px-4 py-4 transition-opacity ${article.isRead ? "opacity-40" : ""} ${loading ? "pointer-events-none" : ""}`} style={{borderBottom:"1px solid var(--border)"}}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}
            className="text-[15px] leading-snug font-medium block transition-colors hover:opacity-80 line-clamp-2"
            style={{color:"var(--text-primary)"}}>
            {article.title || article.url}
          </a>
          <div className="flex items-center gap-2 mt-1.5 text-xs" style={{color:"var(--text-muted)"}}>
            {article.domain && <span>{article.domain}</span>}
            <span>{timeAgo(article.createdAt)}</span>
            {article.popularity > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{fmtPop(article.popularity)}</span>}
          </div>
        </div>
        {article.content && (
          <Link href={`/reader/${article.id}`}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{background:"var(--bg-elevated)", color:"var(--text-secondary)"}}>
            読む
          </Link>
        )}
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {article.tags.map(({ tag }) => (<TagBadge key={tag.id} tag={tag} />))}
        </div>
      )}

      {article.memo && !showMemo && (
        <p className="mt-2 text-xs px-3 py-2 rounded-lg line-clamp-2" style={{background:"var(--bg-elevated)", color:"var(--text-secondary)"}}>{article.memo}</p>
      )}

      <div className="flex items-center gap-1 mt-3">
        <button onClick={() => toggle("isRead")}
          className="h-11 px-4 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
          style={{background: article.isRead ? "var(--accent)" : "var(--bg-elevated)", color: article.isRead ? "#252a34" : "var(--text-secondary)"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {article.isRead ? "読了" : "既読"}
        </button>
        <button onClick={() => toggle("isFavorite")}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-lg transition-colors"
          style={{background:"var(--bg-elevated)", color: article.isFavorite ? "#facc15" : "var(--text-muted)"}}>
          {article.isFavorite ? "★" : "☆"}
        </button>
        <button onClick={() => setShowMemo(!showMemo)}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors"
          style={{background:"var(--bg-elevated)", color: article.memo ? "#facc15" : "var(--text-muted)"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button onClick={() => setShowTags(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-sm font-bold transition-colors"
          style={{background:"var(--bg-elevated)", color:"var(--text-muted)"}}>
          #
        </button>
        <div className="flex-1" />
        <button onClick={remove}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors"
          style={{color:"var(--text-muted)"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {showMemo && (
        <div className="mt-3 space-y-2">
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモを入力..." rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2"
            style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowMemo(false)} className="px-4 py-2.5 text-sm rounded-xl" style={{color:"var(--text-muted)"}}>{"キャンセル"}</button>
            <button onClick={saveMemo} className="px-4 py-2.5 text-sm rounded-xl font-medium text-white" style={{background:"var(--accent)"}}>{"保存"}</button>
          </div>
        </div>
      )}

      {showReadPrompt && (
        <div className="mt-3 p-4 rounded-xl flex items-center justify-between" style={{background:"var(--bg-elevated)"}}>
          <span className="text-sm" style={{color:"var(--text-primary)"}}>{"読了にしますか？"}</span>
          <div className="flex gap-2">
            <button onClick={() => setShowReadPrompt(false)} className="px-4 py-2.5 text-sm rounded-xl" style={{color:"var(--text-muted)"}}>{"あとで"}</button>
            <button onClick={markRead} className="px-4 py-2.5 text-sm rounded-xl font-medium text-white" style={{background:"var(--accent)"}}>{"読了"}</button>
          </div>
        </div>
      )}

      {showTags && (<TagManager articleId={article.id} currentTagIds={article.tags.map(({ tag }) => tag.id)} onUpdate={onUpdate} onClose={() => setShowTags(false)} />)}
    </div>
  );
}
