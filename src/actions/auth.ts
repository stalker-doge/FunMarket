"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/jwt";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { loginLimiter, registerLimiter } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validators";

const STARTING_BALANCE = 5000;

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (hdrs.get("x-forwarded-for")?.split(",")[0]?.trim())
    || hdrs.get("x-real-ip")
    || "unknown";
}

export async function registerAction(formData: FormData) {
  const ip = await getClientIp();
  const rateResult = registerLimiter.check(`register:${ip}`, 3, 60 * 60 * 1000);
  if (!rateResult.allowed) {
    return { error: "Too many registration attempts. Please try again later." };
  }

  const raw = {
    username: (formData.get("username") as string)?.trim().toLowerCase() ?? "",
    email: (formData.get("email") as string)?.trim().toLowerCase() ?? "",
    password: (formData.get("password") as string) ?? "",
    displayName: (formData.get("displayName") as string)?.trim() ?? "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { username, email, password, displayName } = parsed.data;

  const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
  if (existingUsername) return { error: "Username already taken" };

  const existingEmail = await db.select().from(users).where(eq(users.email, email)).get();
  if (existingEmail) return { error: "Email already registered" };

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    username,
    email,
    passwordHash,
    displayName,
    balance: STARTING_BALANCE,
  });

  const user = (await db.select().from(users).where(eq(users.username, username)).get())!;
  const token = await signToken(user.id, user.username);
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const ip = await getClientIp();
  const rateResult = loginLimiter.check(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rateResult.allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const raw = {
    identifier: (formData.get("identifier") as string)?.trim().toLowerCase() ?? "",
    password: (formData.get("password") as string) ?? "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { identifier, password } = parsed.data;

  const user = await db.select().from(users).where(
    or(eq(users.username, identifier), eq(users.email, identifier))
  ).get();
  if (!user) return { error: "Invalid username/email or password" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Invalid username/email or password" };

  const token = await signToken(user.id, user.username);
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function getCurrentUser() {
  return getUser();
}
