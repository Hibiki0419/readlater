import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  return NextResponse.json(await prisma.feed.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { url, name } = await request.json();
  if (!url?.trim() || !name?.trim()) return NextResponse.json({ error: "URL and name are required" }, { status: 400 });

  let feedUrl = url.trim();
  if (!feedUrl.includes("/feed") && !feedUrl.includes("/rss") && !feedUrl.includes(".xml") && !feedUrl.includes("atom")) {
    const discovered = await discoverFeed(feedUrl);
    if (discovered) feedUrl = discovered;
  }

  const feed = await prisma.feed.create({ data: { url: feedUrl, name: name.trim(), userId: auth.userId } });
  return NextResponse.json(feed, { status: 201 });
}

async function discoverFeed(url: string): Promise<string | null> {
  try {
    const { JSDOM } = await import("jsdom");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; ReadLater/1.0)" } });
    clearTimeout(timeout);
    const html = await res.text();
    const dom = new JSDOM(html);
    const link = dom.window.document.querySelector('link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]');
    if (link) {
      const href = link.getAttribute("href");
      if (href) return new URL(href, url).toString();
    }
    return null;
  } catch { return null; }
}
