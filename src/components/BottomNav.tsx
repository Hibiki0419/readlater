"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tag = { id: number; name: string; color: string; _count: { articles: number } };

const tabs = [
  { key: "all", label: "すべて", icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "unread", label: "未読", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { key: "favorites", label: "お気に入り", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
];

export default function BottomNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("filter") || "all";
  const currentTag = searchParams.get("tag") || "";
  const [tags, setTags] = useState<Tag[]>([]);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => { fetch("/read-later/api/tags").then((r) => r.json()).then(setTags); }, []);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-10 safe-bottom" style={{background:"var(--bg-card)", borderTop:"1px solid var(--border)"}}>
        <div className="flex max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = current === tab.key && !currentTag;
            return (
              <button key={tab.key} onClick={() => router.push(`/?filter=${tab.key}`)}
                className="flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] transition-colors"
                style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon}/></svg>
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
          <button onClick={() => setShowTags(!showTags)}
            className="flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] transition-colors"
            style={{ color: currentTag ? "var(--accent)" : "var(--text-muted)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <span className="text-[11px] font-medium">タグ</span>
          </button>
        </div>
      </nav>

      {showTags && (
        <div className="fixed bottom-[4.5rem] left-0 right-0 z-10 p-4 max-h-52 overflow-y-auto" style={{background:"var(--bg-card)", borderTop:"1px solid var(--border)"}}>
          <div className="flex flex-wrap gap-2 max-w-lg mx-auto">
            {tags.length === 0 ? (
              <p className="text-sm" style={{color:"var(--text-muted)"}}>{"タグがありません"}</p>
            ) : tags.map((tag) => (
              <button key={tag.id} onClick={() => { router.push(`/?tag=${encodeURIComponent(tag.name)}`); setShowTags(false); }}
                className={`px-4 py-2 rounded-full text-sm text-white transition-all ${currentTag === tag.name ? "ring-2 ring-white scale-105" : "opacity-80 hover:opacity-100"}`}
                style={{ backgroundColor: tag.color }}>
                {tag.name} ({tag._count.articles})
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
