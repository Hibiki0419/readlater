"use client";

import { useState, useEffect, useCallback } from "react";

type Tag = { id: number; name: string; color: string; _count: { articles: number } };

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"];

export default function TagManager({
  articleId,
  currentTagIds,
  onUpdate,
  onClose,
}: {
  articleId: number;
  currentTagIds: number[];
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<number[]>(currentTagIds);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  const fetchTags = useCallback(async () => {
    const res = await fetch("/read-later/api/tags");
    setTags(await res.json());
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const toggleTag = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const save = async () => {
    await fetch(`/read-later/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds: selected }),
    });
    onUpdate();
    onClose();
  };

  const createTag = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/read-later/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    if (res.ok) {
      const tag = await res.json();
      setSelected((prev) => [...prev, tag.id]);
      setNewName("");
      fetchTags();
    }
  };

  const deleteTag = async (id: number) => {
    await fetch(`/read-later/api/tags/${id}`, { method: "DELETE" });
    setSelected((prev) => prev.filter((t) => t !== id));
    fetchTags();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-slate-800 w-full sm:max-w-sm sm:rounded-xl rounded-t-xl p-4 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-200">タグ管理</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>

        {/* Existing tags */}
        <div className="space-y-1 mb-4">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2">
              <button
                onClick={() => toggleTag(tag.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selected.includes(tag.id)
                    ? "bg-slate-600 text-white"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <span className="text-slate-500 ml-1 text-xs">({tag._count.articles})</span>
              </button>
              <button
                onClick={() => deleteTag(tag.id)}
                className="text-slate-600 hover:text-red-400 p-1 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* New tag */}
        <div className="border-t border-slate-700 pt-3 mb-3">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新しいタグ名"
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              onKeyDown={(e) => e.key === "Enter" && createTag()}
            />
            <button
              onClick={createTag}
              disabled={!newName.trim()}
              className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              追加
            </button>
          </div>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${
                  newColor === c ? "border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={save}
          className="w-full py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-500 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}
