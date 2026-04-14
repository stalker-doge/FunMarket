import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./funmarket.db",
});

export const db = drizzle(client, { schema });

/**
 * Drizzle with libsql returns objects with internal Symbol properties
 * (e.g. async_id_symbol) that can't be serialized by Next.js when passing
 * data from Server Components to Client Components. This helper strips them.
 */
export function plain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
