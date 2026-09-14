import { Router } from "express";
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

authRouter.post("/login", async (req, res) => {
  const { email, password } = parse(credentials, req.body);

  const result = await pool.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];

  // ตอบเหมือนกันทั้ง "ไม่มี email นี้" และ "รหัสผิด" — ไม่ให้คนนอกรู้ว่า email ไหนมีในระบบ
  const ok = user ? await verifyPassword(user.password_hash, password) : false;
  if (!ok) throw new HttpError(401, "invalid_credentials");

  const sessionId = await createSession(user!.id);
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,                                   // JS ในหน้าเว็บอ่านไม่ได้ → ขโมยผ่าน XSS ยากขึ้น
    sameSite: "lax",                                  // เว็บอื่นยิง request มาพร้อม cookie เราไม่ได้ → กัน CSRF พื้นฐาน
    secure: process.env.NODE_ENV === "production",    // ส่งเฉพาะ HTTPS ตอน production
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

// สร้างผู้ใช้ใหม่: ทำได้เฉพาะ manager และสร้างได้เฉพาะในสาขาตัวเอง
// นี่คือ authorization ข้อแรกของระบบ — ไม่ใช่ endpoint สมัครสมาชิกสาธารณะ
const newUser = credentials.extend({ role: z.enum(["manager", "staff"]) });

authRouter.post("/users", requireAuth, async (req, res) => {
  if (req.user!.role !== "manager") throw new HttpError(403, "forbidden");
  const { email, password, role } = parse(newUser, req.body);

  const passwordHash = await hashPassword(password);
  try {
    const result = await pool.query<{ id: number }>(
      "INSERT INTO users (email, password_hash, role, store_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [email, passwordHash, role, req.user!.storeId], // store มาจาก session ไม่ใช่จาก body → ข้ามสาขาไม่ได้
    );
    res.status(201).json({ id: result.rows[0].id, email, role, storeId: req.user!.storeId });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new HttpError(409, "email_taken"); // unique violation จาก DB
    throw err;
  }
});
