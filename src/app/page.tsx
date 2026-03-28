import { Suspense } from "react";
import Link from "next/link";
import ArticleList from "@/components/ArticleList";
import BottomNav from "@/components/BottomNav";
import AuthCheck from "@/components/AuthCheck";

export default function Home() {
  return (
    <AuthCheck>
      <main className="pb-14">
        <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-100">Read Later</h1>
          <Link href="/settings" className="text-slate-400 hover:text-slate-200 text-sm">
            {"\u2699"}
          </Link>
        </header>
        <Suspense fallback={<div className="p-8 text-center text-slate-500">{"\u8aad\u307f\u8fbc\u307f\u4e2d..."}</div>}>
          <ArticleList />
          <BottomNav />
        </Suspense>
      </main>
    </AuthCheck>
  );
}
