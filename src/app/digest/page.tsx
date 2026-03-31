"use client";

import { useEffect, useState, useCallback } from "react";
import MainLayout from "@/components/MainLayout";

type DigestSummary = { id: number; date: string };
type DigestFull = { id: number; date: string; content: string };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
}

export default function DigestPage() {
  const [digests, setDigests] = useState<DigestSummary[]>([]);
  const [selected, setSelected] = useState<DigestFull | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDigests = useCallback(async () => {
    const res = await fetch("/read-later/api/digest");
    if (res.ok) setDigests(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchDigests(); }, [fetchDigests]);

  const loadDigest = async (id: number) => {
    const res = await fetch(`/read-later/api/digest/${id}`);
    if (res.ok) setSelected(await res.json());
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/read-later/api/digest/generate", { method: "POST" });
      if (res.ok) { const data = await res.json(); await fetchDigests(); if (data.id) loadDigest(data.id); }
    } catch {}
    setGenerating(false);
  };

  useEffect(() => { if (digests.length > 0 && !selected) loadDigest(digests[0].id); }, [digests, selected]);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:"1px solid var(--border)"}}>
          <h1 className="text-lg font-semibold" style={{color:"var(--text-primary)"}}>ダイジェスト</h1>
          <button onClick={generate} disabled={generating} className="text-sm px-4 py-2 rounded-xl font-medium text-white disabled:opacity-50 transition-colors" style={{background:"var(--accent)"}}>
            {generating ? "..." : "今すぐ生成"}
          </button>
        </div>

        {digests.length > 0 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{borderBottom:"1px solid var(--border)"}}>
            {digests.map((d) => (
              <button key={d.id} onClick={() => loadDigest(d.id)}
                className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors"
                style={{background: selected?.id === d.id ? "var(--accent)" : "var(--bg-elevated)", color: selected?.id === d.id ? "#252a34" : "var(--text-secondary)"}}>
                {formatDate(d.date)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center" style={{color:"var(--text-muted)"}}>読み込み中...</div>
        ) : selected ? (
          <div className="p-6">
            <p className="text-xs mb-4" style={{color:"var(--text-muted)"}}>{new Date(selected.date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</p>
            <div className="prose prose-sm max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--accent)] prose-strong:text-[var(--text-primary)] prose-li:text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: selected.content }} />
          </div>
        ) : (
          <div className="p-8 text-center" style={{color:"var(--text-muted)"}}>
            <p>ダイジェストがまだありません</p>
            <p className="text-xs mt-2">「今すぐ生成」を押すか、設定でキーワードを登録してください</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
