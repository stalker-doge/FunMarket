import { createHash } from "crypto";

/**
 * Generate a Gravatar URL with identicon fallback.
 * Uses the email as the identifier (proper Gravatar uses MD5 of email).
 */
export function getGravatarUrl(
  email: string,
  size: number = 80
): string {
  const hash = createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}`;
}

/**
 * Get avatar URL: returns custom avatarUrl if set, otherwise Gravatar identicon.
 */
export function getAvatarUrl(
  email: string,
  avatarUrl?: string | null,
  size: number = 80
): string {
  if (avatarUrl) return avatarUrl;
  return getGravatarUrl(email, size);
}
