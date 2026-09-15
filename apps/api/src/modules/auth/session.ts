import { randomBytes } from "node:crypto";
import { pool } from "../../db.js";

export const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionUser = {
  id: number;
  email: string;
  role: "manager" | "staff";
  storeId: number;
};

export async function createSession(userId: number): Promise<string> {
  const id = randomBytes(32).toString("base64url"); // 256 random bits: unguessable
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [id, userId, expiresAt]);
  return id;
}

// Every request carrying the cookie ends up here: session id → user (with role/store for authorization)
export async function findUserBySession(sessionId: string): Promise<SessionUser | null> {
  const result = await pool.query<{ id: number; email: string; role: "manager" | "staff"; store_id: number }>(
    `SELECT u.id, u.email, u.role, u.store_id
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId],
  );
  const row = result.rows[0];
  return row ? { id: row.id, email: row.email, role: row.role, storeId: row.store_id } : null;
}

// Logout = delete the row → the old cookie stops working immediately. This is the advantage of server-side sessions.
export async function deleteSession(sessionId: string): Promise<void> {
  await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}
