import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.AUTH_SECRET;

function getSecret() {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET environment variable is required. Set it in .env or .env.local");
  }
  return new TextEncoder().encode(AUTH_SECRET);
}

const SECRET = getSecret();
export const COOKIE_NAME = "funmarket-session";

export async function signToken(userId: number, username: string): Promise<string> {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  return jwtVerify(token, SECRET);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
