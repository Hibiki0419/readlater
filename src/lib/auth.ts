import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getPrisma } from "./db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "change-me-in-production");

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function getUserFromRequest(request: NextRequest): Promise<{ userId: number } | null> {
  const prisma = getPrisma();

  // Check API token (Authorization: Bearer <token>)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await prisma.user.findUnique({ where: { apiToken: token } });
    if (user) return { userId: user.id };
  }

  // Check JWT cookie
  const cookieToken = request.cookies.get("token")?.value;
  if (!cookieToken) return null;

  try {
    const { payload } = await jwtVerify(cookieToken, secret);
    return { userId: payload.userId as number };
  } catch {
    return null;
  }
}

export async function getUserFromCookie(): Promise<{ userId: number } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as number };
  } catch {
    return null;
  }
}
