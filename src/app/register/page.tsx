"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/read-later/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "登録に失敗しました");
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
        <h1 className="text-2xl font-bold text-center mb-8" style={{color:"var(--text-primary)"}}>新規登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="表示名" autoComplete="name"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
            required
          />
          <div>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザーID (英数字・アンダースコア)" autoComplete="username"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
              required pattern="[a-zA-Z0-9_]{3,20}"
            />
            <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}>3〜20文字、英数字と_のみ</p>
          </div>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード (6文字以上)" autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)"}}
            required minLength={6}
          />
          {error && <p className="text-sm" style={{color:"var(--accent-pink)"}}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-50 transition-colors"
            style={{background:"var(--accent)"}}>
            {loading ? "..." : "登録"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm" style={{color:"var(--text-muted)"}}>
          アカウントをお持ちの場合は
          <Link href="/login" className="ml-1" style={{color:"var(--accent)"}}>ログイン</Link>
        </p>
      </div>
    </main>
  );
}
