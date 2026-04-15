import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().max(200).trim().toLowerCase(),
  password: z.string().max(128),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email().max(200).trim().toLowerCase(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(40).trim(),
});

export const marketSchema = z.object({
  question: z.string().min(1).max(500).trim(),
  description: z.string().max(2000).trim().nullable(),
  category: z.enum(["sports", "crypto", "tech", "politics", "entertainment", "science", "other"]),
  imageUrl: z.string().url().max(500).refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "Image URL must start with http:// or https://"
  ).nullable(),
  closesAt: z.string().nullable(),
  outcomes: z.array(z.string().min(1).max(100).trim()).min(2).max(10),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
});

export const tradeSchema = z.object({
  outcomeId: z.number().int().positive(),
  quantity: z.number().min(1).max(10000),
});

export const displayNameSchema = z.object({
  newName: z.string().min(1).max(40).trim(),
});
