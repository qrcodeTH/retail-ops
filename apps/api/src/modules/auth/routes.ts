import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { pool } from "../../db.js";
import { HttpError } from "../../lib/http-error.js";
import { parse } from "../../lib/validate.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { hashPassword, verifyPassword } from "./password.js";
import { SESSION_COOKIE, createSession, deleteSession } from "./session.js";

export const authRouter = Router();

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

// Brute-force protection: 10 attempts per IP per 15 minutes.
// Argon2 makes each attempt slow on purpose; the limiter stops that slowness from becoming a CPU drain.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = parse(credentials, req.body);

  const result = await pool.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];

  // Same response for "no such email" and "wrong password" — do not reveal which emails exist
  const ok = user ? await verifyPassword(user.password_hash, password) : false;
  if (!ok) throw new HttpError(401, "invalid_credentials");

  const sessionId = await createSession(user!.id);
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,                                   // page JavaScript cannot read it → harder to steal via XSS
    sameSite: "lax",                                  // other sites cannot send requests carrying our cookie → basic CSRF protection
    secure: process.env.NODE_ENV === "production",    // HTTPS only in production
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(204).end();
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  await deleteSession(req.sessionId!);
  res.clearCookie(SESSION_COOKIE);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// Create a user: managers only, and only inside their own store.
// This is the first authorization rule in the system — it is not a public sign-up endpoint.
const newUser = credentials.extend({ role: z.enum(["manager", "staff"]) });

authRouter.post("/users", requireAuth, async (req, res) => {
  if (req.user!.role !== "manager") throw new HttpError(403, "forbidden");
  const { email, password, role } = parse(newUser, req.body);

  const passwordHash = await hashPassword(password);
  try {
    const result = await pool.query<{ id: number }>(
      "INSERT INTO users (email, password_hash, role, store_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [email, passwordHash, role, req.user!.storeId], // store comes from the session, never from the body → cannot cross stores
    );
    res.status(201).json({ id: result.rows[0].id, email, role, storeId: req.user!.storeId });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new HttpError(409, "email_taken"); // unique violation raised by the DB
    throw err;
  }
});
