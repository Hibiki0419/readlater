import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  return NextResponse.json(await prisma.keyword.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { word } = await request.json();
  if (!word?.trim()) return NextResponse.json({ error: "Word is required" }, { status: 400 });
  const keyword = await prisma.keyword.create({ data: { word: word.trim(), userId: auth.userId } });
  return NextResponse.json(keyword, { status: 201 });
}
