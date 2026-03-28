"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch("/read-later/api/auth/me")
      .then((r) => {
        if (!r.ok) { router.replace("/login"); return; }
        setOk(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!ok) return <div className="p-8 text-center text-slate-500">...</div>;
  return <>{children}</>;
}
