import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { doResearch } from "@/lib/research";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const researches = await prisma.research.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, query: true, createdAt: true },
  });
  return NextResponse.json(researches);
}

export async function POST(request: NextRequest) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { query } = await request.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query is required" }, { status: 400 });
  const result = await doResearch(prisma, auth.userId, query.trim());
  return NextResponse.json(result);
}
