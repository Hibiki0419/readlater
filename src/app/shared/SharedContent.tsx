"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SharedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"saving" | "done" | "error">("saving");
  const [msg, setMsg] = useState("保存中...");

  const saveUrl = useCallback(async (url: string) => {
    try {
      const res = await fetch("/read-later/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存に失敗しました");
      }
      setStatus("done");
      setMsg("保存しました！");
      setTimeout(() => router.push("/"), 1200);
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "エラーが発生しました");
    }
  }, [router]);

  useEffect(() => {
    const url = searchParams.get("url") || searchParams.get("text") || "";
    if (!url) {
      setStatus("error");
      setMsg("URLが見つかりません");
      return;
    }
    const urlMatch = url.match(/https?:\/\/\S+/);
    const finalUrl = urlMatch ? urlMatch[0] : url;
    saveUrl(finalUrl);
  }, [searchParams, saveUrl]);

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8">
        <div className={`text-4xl mb-4 ${status === "saving" ? "animate-pulse" : ""}`}>
          {status === "saving" ? "📥" : status === "done" ? "✅" : "❌"}
        </div>
        <p className="text-slate-300 text-lg">{msg}</p>
        {status === "error" && (
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm"
          >
            ホームに戻る
          </button>
        )}
      </div>
    </main>
  );
}
