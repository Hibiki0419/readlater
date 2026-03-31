import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { id } = await params;
  const research = await prisma.research.findFirst({ where: { id: parseInt(id), userId: auth.userId } });
  if (!research) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(research);
}
