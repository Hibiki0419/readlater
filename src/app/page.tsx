import { Suspense } from "react";
import ArticleList from "@/components/ArticleList";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  return (
    <main className="pb-14 md:pb-0">
      <Suspense fallback={<div className="p-12 text-center" style={{color:"var(--text-muted)"}}>読み込み中...</div>}>
        <ArticleList />
        <BottomNav />
      </Suspense>
    </main>
  );
}
