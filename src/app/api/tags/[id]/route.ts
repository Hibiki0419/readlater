import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { id } = await params;
  await prisma.tag.deleteMany({ where: { id: parseInt(id), userId: auth.userId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const { id } = await params;
  const body = await request.json();
  const data: Record<string, string> = {};
  if (body.name) data.name = body.name.trim();
  if (body.color) data.color = body.color;
  const tag = await prisma.tag.update({ where: { id: parseInt(id) }, data });
  return NextResponse.json(tag);
}
