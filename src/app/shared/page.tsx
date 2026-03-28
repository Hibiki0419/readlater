"use client";

import { Suspense } from "react";
import SharedContent from "./SharedContent";

export default function SharedPage() {
  return (
    <Suspense fallback={
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="text-4xl mb-4 animate-pulse">📥</div>
          <p className="text-slate-300 text-lg">保存中...</p>
        </div>
      </main>
    }>
      <SharedContent />
    </Suspense>
  );
}
