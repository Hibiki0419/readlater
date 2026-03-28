import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { checkFeedsForUser, checkFeedsForAll } from "@/lib/feed-checker";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const prisma = getPrisma();

  // Cron secret - check all users
  const cronSecret = request.headers.get("X-Cron-Secret");
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    const result = await checkFeedsForAll(prisma);
    return NextResponse.json(result);
  }

  // User auth - check only their feeds
  const auth = await getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await checkFeedsForUser(prisma, auth.userId);
  return NextResponse.json(result);
}
