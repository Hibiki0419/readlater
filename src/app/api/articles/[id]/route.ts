import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { id } = await params;
  const article = await prisma.article.findFirst({
    where: { id: parseInt(id), userId: auth.userId },
    include: { tags: { include: { tag: true } } },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.article.findFirst({ where: { id: parseInt(id), userId: auth.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (typeof body.isRead === "boolean") { data.isRead = body.isRead; data.readAt = body.isRead ? new Date() : null; }
  if (typeof body.isFavorite === "boolean") data.isFavorite = body.isFavorite;
  if (typeof body.title === "string") data.title = body.title;
  if (Array.isArray(body.tagIds)) { data.tags = { deleteMany: {}, create: body.tagIds.map((tagId: number) => ({ tagId })) }; }
  const article = await prisma.article.update({ where: { id: parseInt(id) }, data, include: { tags: { include: { tag: true } } } });
  return NextResponse.json(article);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { id } = await params;
  const existing = await prisma.article.findFirst({ where: { id: parseInt(id), userId: auth.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.article.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
