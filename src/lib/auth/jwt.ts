import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

let _secret: Uint8Array | null = null;
function getSecret() {
  if (!_secret) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error("AUTH_SECRET environment variable is required. Set it in .env or .env.local");
    }
    _secret = new TextEncoder().encode(secret);
  }
  return _secret;
}
export const COOKIE_NAME = "funmarket-session";

export async function signToken(userId: number, username: string): Promise<string> {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  return jwtVerify(token, getSecret());
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
