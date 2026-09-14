import express from "express";
import cookieParser from "cookie-parser";
import type { ErrorRequestHandler } from "express";
import { pool } from "./db.js";
import { HttpError } from "./lib/http-error.js";
import { authRouter } from "./modules/auth/routes.js";
import { tasksRouter } from "./modules/tasks/routes.js";

// แยก app ออกจาก server เพื่อให้ test import app ได้โดยไม่ต้องเปิด port จริง
export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", async (_req, res) => {
    // ถาม DB จริง ไม่ใช่แค่ตอบ ok — ถ้า DB ล่ม health ต้องบอกว่าล่ม
    try {
      const result = await pool.query<{ now: string }>("SELECT now()");
      res.json({ status: "ok", dbTime: result.rows[0].now });
    } catch (err) {
      // 503 = service unavailable: ตัว API ยังอยู่ แต่ dependency ที่ต้องใช้ล่ม
      res.status(503).json({ status: "degraded", db: (err as Error).message });
    }
  });

  app.use("/auth", authRouter);
  app.use("/tasks", tasksRouter);

  // ตาข่ายสุดท้าย: HttpError ที่ตั้งใจโยน → status ของมัน; error อื่น = bug → 500 ไม่เปิดเผยรายละเอียด
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.code, message: err.message });
      return;
    }
    console.error("unhandled request error:", err);
    res.status(500).json({ error: "internal_error" });
  };
  app.use(onError);

  return app;
}
