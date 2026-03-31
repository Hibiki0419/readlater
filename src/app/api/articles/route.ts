import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { fetchArticleData } from "@/lib/fetch-title";
import { fetchPopularity } from "@/lib/popularity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get("filter") || "all";
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") || "newest";
  const date = searchParams.get("date"); // YYYY-MM-DD
  const hasMemo = searchParams.get("hasMemo");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  const where: Record<string, unknown> = { userId: auth.userId };
  if (filter === "unread") where.isRead = false;
  else if (filter === "read") where.isRead = true;
  else if (filter === "favorites") where.isFavorite = true;
  if (tag) where.tags = { some: { tag: { name: tag, userId: auth.userId } } };
  if (hasMemo === "true") where.memo = { not: null };

  if (date) {
    const d = new Date(date + "T00:00:00Z");
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    where.createdAt = { gte: d, lt: next };
  }

  const orderBy = sort === "popular"
    ? { popularity: "desc" as const }
    : { createdAt: "desc" as const };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.article.count({ where }),
  ]);

  // Also return available dates for sidebar
  const dates = await prisma.$queryRawUnsafe<{date: string; count: bigint}[]>(
    `SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo'), 'YYYY-MM-DD') as date, COUNT(*) as count FROM articles WHERE user_id = $1 GROUP BY date ORDER BY date DESC LIMIT 30`,
    auth.userId
  );

  return NextResponse.json({
    articles, total, page,
    totalPages: Math.ceil(total / perPage),
    dates: dates.map(d => ({ date: String(d.date).slice(0,10), count: Number(d.count) })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await request.json();
  const { url } = body;

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  try { new URL(url); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

  const [articleData, popularity] = await Promise.all([
    fetchArticleData(url),
    fetchPopularity(url),
  ]);

  const article = await prisma.article.create({
    data: { url, title: articleData.title, domain: articleData.domain, content: articleData.content, excerpt: articleData.excerpt, popularity, userId: auth.userId },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(article, { status: 201 });
}
