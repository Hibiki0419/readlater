import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  const { username, password, name } = await request.json();

  if (!username?.trim() || !password || !name?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
    return NextResponse.json({ error: "ID is 3-20 chars, alphanumeric and underscore only" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (exists) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username: username.trim(), password: hashed, name: name.trim() },
  });

  // First user inherits orphaned data
  const userCount = await prisma.user.count();
  if (userCount === 1) {
    await prisma.article.updateMany({ where: { userId: null }, data: { userId: user.id } });
    await prisma.tag.updateMany({ where: { userId: null }, data: { userId: user.id } });
    await prisma.keyword.updateMany({ where: { userId: null }, data: { userId: user.id } });
    await prisma.feed.updateMany({ where: { userId: null }, data: { userId: user.id } });
  }

  const token = await createToken(user.id);
  const res = NextResponse.json({ id: user.id, username: user.username, name: user.name });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
