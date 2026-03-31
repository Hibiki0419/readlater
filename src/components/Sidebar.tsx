"use client";

import { useRouter } from "next/navigation";

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

export default function Sidebar({ dates, currentDate, onSelectDate, onClose, isDesktop }: {
  dates: DateCount[]; currentDate: string; onSelectDate: (d: string) => void; onClose: () => void; isDesktop?: boolean;
}) {
  const router = useRouter();
  const nav = (href: string) => { router.push(href); if (!isDesktop) onClose(); };
  const selectDate = (d: string) => { onSelectDate(d); if (!isDesktop) onClose(); };

  const sidebarContent = (
    <div className="h-full overflow-y-auto p-5" style={{background:"var(--bg-card)"}}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold" style={{color:"var(--text-primary)"}}>Read Later</h2>
        {!isDesktop && (
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-hover)]" style={{color:"var(--text-muted)"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      <div className="space-y-1 mb-6">
        {[
          { href: "/digest", label: "ダイジェスト", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
          { href: "/research", label: "リサーチ", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
          { href: "/memos", label: "メモ一覧", icon: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" },
          { href: "/settings", label: "設定", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
        ].map((item) => (
          <button key={item.href} onClick={() => nav(item.href)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors hover:bg-[var(--bg-hover)]" style={{color:"var(--text-secondary)"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
            {item.label}
          </button>
        ))}
      </div>

      <div className="border-t pt-4" style={{borderColor:"var(--border)"}}>
        <p className="text-xs font-medium mb-3 px-2" style={{color:"var(--text-muted)"}}>日付で絞り込み</p>
        <button onClick={() => selectDate("")}
          className="w-full text-left px-4 py-3 rounded-xl text-sm mb-1 transition-colors"
          style={{background: !currentDate ? "var(--bg-hover)" : "transparent", color: !currentDate ? "var(--accent)" : "var(--text-secondary)"}}>
          すべての日付
        </button>
        {dates.map((d) => (
          <button key={d.date} onClick={() => selectDate(d.date)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm mb-1 transition-colors flex justify-between"
            style={{background: currentDate === d.date ? "var(--bg-hover)" : "transparent", color: currentDate === d.date ? "var(--accent)" : "var(--text-secondary)"}}>
            <span>{formatDateLabel(d.date)}</span>
            <span style={{color:"var(--text-muted)"}}>{d.count}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (isDesktop) {
    return <aside className="w-72 h-screen sticky top-0 shrink-0" style={{borderRight:"1px solid var(--border)"}}>{sidebarContent}</aside>;
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="w-72 h-full" onClick={(e) => e.stopPropagation()}>{sidebarContent}</div>
      <div className="flex-1 bg-black/50" />
    </div>
  );
}
