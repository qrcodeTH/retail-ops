import express from "express";
import cookieParser from "cookie-parser";
import type { ErrorRequestHandler } from "express";
import { pool } from "./db.js";
import { DomainError, type DomainErrorCode } from "./lib/domain-error.js";
import { HttpError } from "./lib/http-error.js";
import { authRouter } from "./modules/auth/routes.js";
import { tasksRouter } from "./modules/tasks/routes.js";

const DOMAIN_STATUS: Record<DomainErrorCode, number> = { not_found: 404, forbidden: 403, invalid_transition: 409 };

// app is separate from server so tests can import it without opening a real port
export function createApp() {
  const app = express();
  // Behind Render's load balancer the client IP arrives in X-Forwarded-For; trust exactly one proxy hop
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", async (_req, res) => {
    // Query the DB for real, don't just answer ok — if the DB is down, health must say so
    try {
      const result = await pool.query<{ now: string }>("SELECT now()");
      res.json({ status: "ok", dbTime: result.rows[0].now });
    } catch (err) {
      // 503 = service unavailable: the API itself is alive, but a dependency it needs is down
      res.status(503).json({ status: "degraded", db: (err as Error).message });
    }
  });

  app.use("/auth", authRouter);
  app.use("/tasks", tasksRouter());

  // Last line of defence: an intentional HttpError → its status; anything else is a bug → 500 with no details leaked
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof DomainError) {
      // Business rules know nothing about HTTP — code → status is mapped here, in one place
      res.status(DOMAIN_STATUS[err.code]).json({ error: err.code, message: err.message });
      return;
    }
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
