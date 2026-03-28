import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { fetchArticleData } from "@/lib/fetch-title";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get("filter") || "all";
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  const where: Record<string, unknown> = { userId: auth.userId };
  if (filter === "unread") where.isRead = false;
  else if (filter === "read") where.isRead = true;
  else if (filter === "favorites") where.isFavorite = true;
  if (tag) where.tags = { some: { tag: { name: tag, userId: auth.userId } } };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, totalPages: Math.ceil(total / perPage) });
}

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await request.json();
  const { url } = body;

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  try { new URL(url); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

  const { title, domain, content, excerpt } = await fetchArticleData(url);

  const article = await prisma.article.create({
    data: { url, title, domain, content, excerpt, userId: auth.userId },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(article, { status: 201 });
}
