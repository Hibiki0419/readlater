"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import TagBadge from "./TagBadge";
import TagManager from "./TagManager";

type Tag = { id: number; name: string; color: string };
type Article = {
  id: number;
  url: string;
  title: string | null;
  domain: string | null;
  content: string | null;
  isRead: boolean;
  isFavorite: boolean;
  createdAt: string;
  tags: { tag: Tag }[];
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export default function ArticleCard({
  article,
  onUpdate,
}: {
  article: Article;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showReadPrompt, setShowReadPrompt] = useState(false);
  const clickedRef = useRef(false);

  const handleVisibility = useCallback(() => {
    if (document.visibilityState === "visible" && clickedRef.current) {
      clickedRef.current = false;
      setShowReadPrompt(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [handleVisibility]);

  const handleLinkClick = () => {
    if (!article.isRead) {
      clickedRef.current = true;
    }
  };

  const markRead = async () => {
    setShowReadPrompt(false);
    setLoading(true);
    await fetch(`/read-later/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    onUpdate();
    setLoading(false);
  };

  const toggle = async (field: "isRead" | "isFavorite") => {
    setLoading(true);
    await fetch(`/read-later/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !article[field] }),
    });
    onUpdate();
    setLoading(false);
  };

  const remove = async () => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/read-later/api/articles/${article.id}`, { method: "DELETE" });
    onUpdate();
  };

  return (
    <div
      className={`p-4 border-b border-slate-700 ${
        article.isRead ? "opacity-50" : ""
      } ${loading ? "pointer-events-none" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="text-slate-100 font-medium hover:text-sky-400 transition-colors line-clamp-2 block flex-1"
            >
              {article.title || article.url}
            </a>
            {article.content && (
              <Link
                href={`/reader/${article.id}`}
                className="shrink-0 text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
              >
                読む
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            {article.domain && <span>{article.domain}</span>}
            <span>{timeAgo(article.createdAt)}</span>
          </div>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {article.tags.map(({ tag }) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowTags(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-400 transition-colors"
            title="タグ"
          >
            #
          </button>
          <button
            onClick={() => toggle("isFavorite")}
            className={`p-2 rounded-lg transition-colors ${
              article.isFavorite
                ? "text-yellow-400"
                : "text-slate-600 hover:text-slate-400"
            }`}
            title="お気に入り"
          >
            {article.isFavorite ? "★" : "☆"}
          </button>
          <button
            onClick={() => toggle("isRead")}
            className={`p-2 rounded-lg transition-colors ${
              article.isRead
                ? "text-green-400"
                : "text-slate-600 hover:text-slate-400"
            }`}
            title={article.isRead ? "未読に戻す" : "読了"}
          >
            ✓
          </button>
          <button
            onClick={remove}
            className="p-2 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
            title="削除"
          >
            ✕
          </button>
        </div>
      </div>

      {showReadPrompt && (
        <div className="mt-3 p-3 bg-slate-700/80 rounded-lg flex items-center justify-between gap-3">
          <span className="text-sm text-slate-200">読了にしますか？</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReadPrompt(false)}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              あとで
            </button>
            <button
              onClick={markRead}
              className="px-3 py-1.5 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
            >
              読了
            </button>
          </div>
        </div>
      )}

      {showTags && (
        <TagManager
          articleId={article.id}
          currentTagIds={article.tags.map(({ tag }) => tag.id)}
          onUpdate={onUpdate}
          onClose={() => setShowTags(false)}
        />
      )}
    </div>
  );
}
