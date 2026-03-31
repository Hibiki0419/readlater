"use client";

import { useState } from "react";

export default function AddArticleForm({ onAdded }: { onAdded: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/read-later/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || "保存に失敗"); return; }
      setUrl("");
      onAdded();
    } catch { setError("通信エラー"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4" style={{background:"var(--bg-card)", borderBottom:"1px solid var(--border)"}}>
      <div className="flex gap-3 max-w-lg mx-auto">
        <input
          type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="URLを追加..."
          className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
          style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !url.trim()}
          className="px-5 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-all"
          style={{background:"var(--accent)"}}>
          {loading ? "..." : "追加"}
        </button>
      </div>
      {error && <p className="mt-2 text-red-400 text-xs text-center">{error}</p>}
    </form>
  );
}
