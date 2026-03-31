"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";

type Keyword = { id: number; word: string };
type Feed = { id: number; url: string; name: string };
type User = { id: number; username: string; name: string; apiToken: string };

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedName, setNewFeedName] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const fetchData = useCallback(async () => {
    const [me, kw, fd] = await Promise.all([
      fetch("/read-later/api/auth/me").then(r => r.json()),
      fetch("/read-later/api/keywords").then(r => r.json()),
      fetch("/read-later/api/feeds").then(r => r.json()),
    ]);
    setUser(me); setKeywords(kw); setFeeds(fd);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addKeyword = async () => { if (!newWord.trim()) return; await fetch("/read-later/api/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: newWord.trim() }) }); setNewWord(""); fetchData(); };
  const deleteKeyword = async (id: number) => { await fetch(`/read-later/api/keywords/${id}`, { method: "DELETE" }); fetchData(); };
  const addFeed = async () => { if (!newFeedUrl.trim() || !newFeedName.trim()) return; await fetch("/read-later/api/feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: newFeedUrl.trim(), name: newFeedName.trim() }) }); setNewFeedUrl(""); setNewFeedName(""); fetchData(); };
  const deleteFeed = async (id: number) => { await fetch(`/read-later/api/feeds/${id}`, { method: "DELETE" }); fetchData(); };
  const runCheck = async () => { setChecking(true); setCheckResult(null); try { const res = await fetch("/read-later/api/feeds/check", { method: "POST" }); const data = await res.json(); setCheckResult(`${data.added} 件の記事を追加しました`); } catch { setCheckResult("エラーが発生しました"); } setChecking(false); };
  const logout = async () => { await fetch("/read-later/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); };

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto pb-20">
        <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:"1px solid var(--border)"}}>
          <h1 className="text-lg font-semibold" style={{color:"var(--text-primary)"}}>設定</h1>
          <button onClick={logout} className="text-sm px-3 py-1.5 rounded-xl transition-colors" style={{color:"var(--accent-pink)"}}>ログアウト</button>
        </div>

        {user && (
          <section className="p-4" style={{borderBottom:"1px solid var(--border)"}}>
            <h2 className="text-sm font-bold mb-2" style={{color:"var(--text-primary)"}}>アカウント</h2>
            <p className="text-sm" style={{color:"var(--text-secondary)"}}>{user.name} (@{user.username})</p>
            <div className="mt-2">
              <button onClick={() => setShowToken(!showToken)} className="text-xs" style={{color:"var(--accent)"}}>APIトークンを{showToken ? "隠す" : "表示"}</button>
              {showToken && <div className="mt-1 p-2 rounded text-xs font-mono break-all select-all" style={{background:"var(--bg-elevated)", color:"var(--text-secondary)"}}>{user.apiToken}</div>}
              <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}>iOSショートカットのAuthorizationヘッダに「Bearer [トークン]」を設定</p>
            </div>
          </section>
        )}

        <section className="p-4">
          <h2 className="text-sm font-bold mb-3" style={{color:"var(--text-primary)"}}>キーワード</h2>
          <p className="text-xs mb-3" style={{color:"var(--text-muted)"}}>登録したキーワードにGoogle Newsでマッチする記事が自動追加されます</p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="例: Next.js, Rust, AI" className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}} onKeyDown={(e) => e.key === "Enter" && addKeyword()} />
            <button onClick={addKeyword} disabled={!newWord.trim()} className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{background:"var(--accent)"}}>追加</button>
          </div>
          <div className="space-y-1">{keywords.map((kw) => (
            <div key={kw.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{background:"var(--bg-elevated)"}}>
              <span className="text-sm" style={{color:"var(--text-primary)"}}>{kw.word}</span>
              <button onClick={() => deleteKeyword(kw.id)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{color:"var(--text-muted)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}</div>
        </section>

        <section className="p-4" style={{borderTop:"1px solid var(--border)"}}>
          <h2 className="text-sm font-bold mb-3" style={{color:"var(--text-primary)"}}>RSSフィード</h2>
          <p className="text-xs mb-3" style={{color:"var(--text-muted)"}}>サイトのURLを入力するとRSSを自動検出します</p>
          <div className="space-y-2 mb-3">
            <input type="text" value={newFeedName} onChange={(e) => setNewFeedName(e.target.value)} placeholder="フィード名 (例: Zenn)" className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}} />
            <div className="flex gap-2">
              <input type="url" value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} placeholder="サイトURLまたはRSS URL" className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2" style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}} onKeyDown={(e) => e.key === "Enter" && addFeed()} />
              <button onClick={addFeed} disabled={!newFeedUrl.trim() || !newFeedName.trim()} className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{background:"var(--accent)"}}>追加</button>
            </div>
          </div>
          <div className="space-y-1">{feeds.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{background:"var(--bg-elevated)"}}>
              <div className="min-w-0 flex-1"><div className="text-sm" style={{color:"var(--text-primary)"}}>{f.name}</div><div className="text-xs truncate" style={{color:"var(--text-muted)"}}>{f.url}</div></div>
              <button onClick={() => deleteFeed(f.id)} className="w-8 h-8 flex items-center justify-center rounded-lg ml-2" style={{color:"var(--text-muted)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}</div>
        </section>

        <section className="p-4" style={{borderTop:"1px solid var(--border)"}}>
          <h2 className="text-sm font-bold mb-3" style={{color:"var(--text-primary)"}}>手動チェック</h2>
          <p className="text-xs mb-3" style={{color:"var(--text-muted)"}}>通常は30分ごとに自動巡回します</p>
          <button onClick={runCheck} disabled={checking} className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors" style={{background:"var(--accent)"}}>{checking ? "チェック中..." : "今すぐチェック"}</button>
          {checkResult && <p className="mt-2 text-sm text-center" style={{color:"var(--text-secondary)"}}>{checkResult}</p>}
        </section>
      </div>
    </MainLayout>
  );
}
