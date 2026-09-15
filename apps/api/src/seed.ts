import "dotenv/config";
import { pool } from "./db.js";
import { hashPassword } from "./modules/auth/password.js";

// Dev/demo data: 2 stores, each with 1 manager + 1 staff. Idempotent (safe to run repeatedly).
// Every user's password: password123
async function seed() {
  const hash = await hashPassword("password123");
  for (const [code, name] of [["BKK-001", "Silom branch"], ["CNX-001", "Nimman branch"]]) {
    const store = await pool.query<{ id: number }>(
      "INSERT INTO stores (code, name) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id",
      [code, name],
    );
    const storeId = store.rows[0].id;
    const prefix = code.split("-")[0].toLowerCase();
    for (const role of ["manager", "staff"] as const) {
      await pool.query(
        "INSERT INTO users (email, password_hash, role, store_id) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
        [`${role}.${prefix}@retail.test`, hash, role, storeId],
      );
    }
  }
  console.log("seeded: manager.bkk / staff.bkk / manager.cnx / staff.cnx @retail.test (password123)");
  await pool.end();
}
seed().catch((e) => { console.error(e); process.exit(1); });
