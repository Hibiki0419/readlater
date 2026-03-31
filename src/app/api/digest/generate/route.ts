import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { generateDigest, generateDigestForAll } from "@/lib/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const prisma = getPrisma();

  // Cron secret - generate for all users
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    const result = await generateDigestForAll(prisma);
    return NextResponse.json(result);
  }

  // User auth
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await generateDigest(prisma, auth.userId);
  if (!result) return NextResponse.json({ error: "No keywords configured" }, { status: 400 });
  return NextResponse.json(result);
}
