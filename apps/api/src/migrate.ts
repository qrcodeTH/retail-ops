import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./db.js";

// Simplest possible migration runner: apply the .sql files in migrations/ in filename order.
// Applied files are recorded in schema_migrations so they never run twice.
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);

  const dir = path.resolve(import.meta.dirname, "../migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const done = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
    if (done.rowCount) continue;

    const sql = await readFile(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      // One file = one transaction: a migration that fails halfway must leave nothing behind
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
