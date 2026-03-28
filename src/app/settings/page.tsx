"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Keyword = { id: number; word: string };
type Feed = { id: number; url: string; name: string };
type User = { id: number; email: string; name: string; apiToken: string };

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
      fetch("/read-later/api/auth/me").then((r) => r.json()),
      fetch("/read-later/api/keywords").then((r) => r.json()),
      fetch("/read-later/api/feeds").then((r) => r.json()),
    ]);
    setUser(me);
    setKeywords(kw);
    setFeeds(fd);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addKeyword = async () => {
    if (!newWord.trim()) return;
    const res = await fetch("/read-later/api/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: newWord.trim() }) });
    if (res.ok) { setNewWord(""); fetchData(); }
  };
  const deleteKeyword = async (id: number) => {
    await fetch(`/read-later/api/keywords/${id}`, { method: "DELETE" });
    fetchData();
  };
  const addFeed = async () => {
    if (!newFeedUrl.trim() || !newFeedName.trim()) return;
    const res = await fetch("/read-later/api/feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: newFeedUrl.trim(), name: newFeedName.trim() }) });
    if (res.ok) { setNewFeedUrl(""); setNewFeedName(""); fetchData(); }
  };
  const deleteFeed = async (id: number) => {
    await fetch(`/read-later/api/feeds/${id}`, { method: "DELETE" });
    fetchData();
  };
  const runCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch("/read-later/api/feeds/check", { method: "POST" });
      const data = await res.json();
      setCheckResult(`${data.added} 件の記事を追加しました`);
    } catch {
      setCheckResult("エラーが発生しました");
    }
    setChecking(false);
  };
  const logout = async () => {
    await fetch("/read-later/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="max-w-lg mx-auto pb-20">
      <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-slate-400 hover:text-slate-200 text-lg">{"\u2190"}</button>
        <h1 className="text-lg font-bold text-slate-100 flex-1">設定</h1>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400">ログアウト</button>
      </header>

      {user && (
        <section className="p-4 border-b border-slate-700">
          <h2 className="text-sm font-bold text-slate-300 mb-2">アカウント</h2>
          <p className="text-sm text-slate-400">{user.name} ({user.email})</p>
          <div className="mt-2">
            <button onClick={() => setShowToken(!showToken)} className="text-xs text-sky-400 hover:text-sky-300">
              {"API\u30c8\u30fc\u30af\u30f3\u3092"}{showToken ? "隠す" : "表示"}
            </button>
            {showToken && (
              <div className="mt-1 p-2 bg-slate-800 rounded text-xs text-slate-300 font-mono break-all select-all">{user.apiToken}</div>
            )}
            <p className="text-xs text-slate-600 mt-1">iOSショートカットのAuthorizationヘッダに「Bearer [トークン]」を設定</p>
          </div>
        </section>
      )}

      <section className="p-4">
        <h2 className="text-sm font-bold text-slate-300 mb-3">キーワード</h2>
        <p className="text-xs text-slate-500 mb-3">登録したキーワードにGoogle Newsでマッチする記事が自動追加されます</p>
        <div className="flex gap-2 mb-3">
          <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="例: Next.js, Rust, AI" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" onKeyDown={(e) => e.key === "Enter" && addKeyword()} />
          <button onClick={addKeyword} disabled={!newWord.trim()} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm disabled:opacity-50">追加</button>
        </div>
        <div className="space-y-1">{keywords.map((kw) => (
          <div key={kw.id} className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg">
            <span className="text-sm text-slate-200">{kw.word}</span>
            <button onClick={() => deleteKeyword(kw.id)} className="text-slate-600 hover:text-red-400 text-sm">{"\u2715"}</button>
          </div>
        ))}</div>
      </section>

      <section className="p-4 border-t border-slate-700">
        <h2 className="text-sm font-bold text-slate-300 mb-3">RSSフィード</h2>
        <p className="text-xs text-slate-500 mb-3">サイトのURLを入力するとRSSを自動検出します。キーワードにマッチした記事が自動追加されます</p>
        <div className="space-y-2 mb-3">
          <input type="text" value={newFeedName} onChange={(e) => setNewFeedName(e.target.value)} placeholder="フィード名 (例: Zenn)" className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
          <div className="flex gap-2">
            <input type="url" value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} placeholder="サイトURLまたはRSS URL" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" onKeyDown={(e) => e.key === "Enter" && addFeed()} />
            <button onClick={addFeed} disabled={!newFeedUrl.trim() || !newFeedName.trim()} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm disabled:opacity-50">追加</button>
          </div>
        </div>
        <div className="space-y-1">{feeds.map((f) => (
          <div key={f.id} className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg">
            <div className="min-w-0 flex-1"><div className="text-sm text-slate-200">{f.name}</div><div className="text-xs text-slate-500 truncate">{f.url}</div></div>
            <button onClick={() => deleteFeed(f.id)} className="text-slate-600 hover:text-red-400 text-sm ml-2">{"\u2715"}</button>
          </div>
        ))}</div>
      </section>

      <section className="p-4 border-t border-slate-700">
        <h2 className="text-sm font-bold text-slate-300 mb-3">手動チェック</h2>
        <p className="text-xs text-slate-500 mb-3">通常は30分ごとに自動巡回します</p>
        <button onClick={runCheck} disabled={checking} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors">{checking ? "チェック中..." : "今すぐチェック"}</button>
        {checkResult && <p className="mt-2 text-sm text-center text-slate-400">{checkResult}</p>}
      </section>
    </main>
  );
}
