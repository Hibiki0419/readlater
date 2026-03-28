import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const tags = await prisma.tag.findMany({ where: { userId: auth.userId }, orderBy: { name: "asc" }, include: { _count: { select: { articles: true } } } });
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { name, color } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const tag = await prisma.tag.create({ data: { name: name.trim(), userId: auth.userId, ...(color ? { color } : {}) } });
  return NextResponse.json(tag, { status: 201 });
}
