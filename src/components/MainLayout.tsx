"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AuthCheck from "./AuthCheck";

type DateCount = { date: string; count: number };

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "今日";
  if (diff === 1) return "昨日";
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日","月","火","水","木","金","土"][d.getDay()];
  return `${month}/${day} (${weekday})`;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

const navItems = [
  { href: "/", label: "記事一覧", icon: "M4 6h16M4 12h16M4 18h16" },
  { href: "/digest", label: "ダイジェスト", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { href: "/research", label: "リサーチ", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/memos", label: "メモ一覧", icon: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" },
  { href: "/settings", label: "設定", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

export default function MainLayout({
  children,
  dates,
  currentDate,
  onSelectDate,
}: {
  children: React.ReactNode;
  dates?: DateCount[];
  currentDate?: string;
  onSelectDate?: (d: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const sidebarContent = (
    <div className="h-full overflow-y-auto p-5" style={{background:"var(--bg-card)"}}>
      <h2 className="text-lg font-semibold mb-6" style={{color:"var(--text-primary)"}}>Read Later</h2>

      <div className="space-y-1 mb-6">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <button key={item.href} onClick={() => { router.push(item.href); setShowMobileSidebar(false); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors"
              style={{
                background: active ? "var(--bg-hover)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
              {item.label}
            </button>
          );
        })}
      </div>

      {dates && dates.length > 0 && onSelectDate && (
        <div className="border-t pt-4" style={{borderColor:"var(--border)"}}>
          <p className="text-xs font-medium mb-3 px-2" style={{color:"var(--text-muted)"}}>日付で絞り込み</p>
          <button onClick={() => { onSelectDate(""); setShowMobileSidebar(false); }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm mb-1 transition-colors"
            style={{background: !currentDate ? "var(--bg-hover)" : "transparent", color: !currentDate ? "var(--accent)" : "var(--text-secondary)"}}>
            すべて
          </button>
          {dates.map((d) => (
            <button key={d.date} onClick={() => { onSelectDate(d.date); setShowMobileSidebar(false); }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm mb-1 transition-colors flex justify-between"
              style={{background: currentDate === d.date ? "var(--bg-hover)" : "transparent", color: currentDate === d.date ? "var(--accent)" : "var(--text-secondary)"}}>
              <span>{formatDateLabel(d.date)}</span>
              <span style={{color:"var(--text-muted)"}}>{d.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AuthCheck>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        {isDesktop && (
          <aside className="w-72 h-screen sticky top-0 shrink-0" style={{borderRight:"1px solid var(--border)"}}>
            {sidebarContent}
          </aside>
        )}

        {/* Mobile sidebar overlay */}
        {!isDesktop && showMobileSidebar && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setShowMobileSidebar(false)}>
            <div className="w-72 h-full" onClick={(e) => e.stopPropagation()}>{sidebarContent}</div>
            <div className="flex-1 bg-black/30" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile header with hamburger */}
          {!isDesktop && (
            <header className="sticky top-0 z-10 safe-top px-4 py-3 flex items-center gap-3" style={{background:"var(--bg-primary)", borderBottom:"1px solid var(--border)"}}>
              <button onClick={() => setShowMobileSidebar(true)} className="w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-hover)]" style={{color:"var(--text-secondary)"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <span className="text-lg font-semibold" style={{color:"var(--text-primary)"}}>Read Later</span>
            </header>
          )}
          {children}
        </div>
      </div>
    </AuthCheck>
  );
}
