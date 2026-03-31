"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/read-later/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "ログインに失敗しました");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen p-4" style={{background:"var(--bg-primary)"}}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8" style={{color:"var(--text-primary)"}}>Read Later</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="ユーザーID" autoComplete="username"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
            required
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード" autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
            required
          />
          {error && <p className="text-sm" style={{color:"var(--accent-pink)"}}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-50 transition-colors"
            style={{background:"var(--accent)"}}>
            {loading ? "..." : "ログイン"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm" style={{color:"var(--text-muted)"}}>
          アカウントがない場合は
          <Link href="/register" className="ml-1" style={{color:"var(--accent)"}}>新規登録</Link>
        </p>
      </div>
    </main>
  );
}
