import { neon } from "@neondatabase/serverless";

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("FAIL: DATABASE_URL missing (.env.local)");
    process.exit(2);
  }

  const sql = neon(url);
  let ok = false;
  for (let i = 1; i <= 4 && !ok; i++) {
    try {
      const t0 = Date.now();
      const [r] = await sql`select now() as now, current_database() as db, current_user as usr, version() as v`;
      console.log(
        `OK attempt ${i} in ${Date.now() - t0}ms`,
        { db: r.db, user: r.usr, now: r.now }
      );
      ok = true;
    } catch (e) {
      console.warn(`attempt ${i} failed:`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 600 * i));
    }
  }
  if (!ok) {
    console.error("FAIL: could not reach Neon");
    process.exit(1);
  }
})();
