import "server-only";
import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;
let _sql: Sql | undefined;

export function sql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local"
    );
  }
  return (_sql ??= neon(url));
}

/** Neon computes suspend when idle; the first query can be slow or fail once. Retry briefly. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  tries = 3,
  shouldRetry: (e: unknown) => boolean = () => true
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!shouldRetry(e)) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw last;
}
