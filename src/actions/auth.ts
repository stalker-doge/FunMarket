"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/jwt";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const STARTING_BALANCE = 5000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(formData: FormData) {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const displayName = (formData.get("displayName") as string)?.trim();

  if (!username || !email || !password || !displayName) {
    return { error: "All fields are required" };
  }
  if (username.length < 3) return { error: "Username must be at least 3 characters" };
  if (!EMAIL_REGEX.test(email)) return { error: "Please enter a valid email address" };
  if (password.length < 4) return { error: "Password must be at least 4 characters" };

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
  const identifier = (formData.get("identifier") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!identifier || !password) return { error: "Username/email and password are required" };

  // Look up by username or email
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
