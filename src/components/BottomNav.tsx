"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tag = { id: number; name: string; color: string; _count: { articles: number } };

const baseTabs = [
  { key: "all", label: "すべて" },
  { key: "unread", label: "未読" },
  { key: "favorites", label: "お気に入り" },
];

export default function BottomNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("filter") || "all";
  const currentTag = searchParams.get("tag") || "";
  const [tags, setTags] = useState<Tag[]>([]);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    fetch("/read-later/api/tags")
      .then((r) => r.json())
      .then(setTags);
  }, []);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex z-10">
        {baseTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(`/?filter=${tab.key}`)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              current === tab.key && !currentTag
                ? "text-sky-400 border-t-2 border-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setShowTags(!showTags)}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            currentTag
              ? "text-sky-400 border-t-2 border-sky-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          タグ
        </button>
      </nav>

      {showTags && (
        <div className="fixed bottom-14 left-0 right-0 bg-slate-800 border-t border-slate-700 z-10 p-3 max-h-48 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-slate-500 text-sm">タグがありません</p>
            ) : (
              tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    router.push(`/?tag=${encodeURIComponent(tag.name)}`);
                    setShowTags(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm text-white transition-opacity ${
                    currentTag === tag.name ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name} ({tag._count.articles})
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
