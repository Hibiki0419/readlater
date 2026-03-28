import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const prisma = getPrisma();
  const { email, password, name } = await request.json();

  if (!email?.trim() || !password || !name?.trim()) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: email.trim(), password: hashed, name: name.trim() },
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
  const res = NextResponse.json({ id: user.id, email: user.email, name: user.name });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
