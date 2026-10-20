import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

(async () => {
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(
    `create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`
  );
  const done = new Set(
    (await pool.query(`select name from _migrations`)).rows.map((r) => r.name)
  );
  const dir = join(process.cwd(), "db", "migrations");

  for (const f of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (done.has(f)) {
      console.log("skip", f);
      continue;
    }
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(readFileSync(join(dir, f), "utf8"));
      await client.query("insert into _migrations(name) values ($1)", [f]);
      await client.query("commit");
      console.log("applied", f);
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }
  await pool.end();
})();
