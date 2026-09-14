import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { SESSION_COOKIE, findUserBySession, type SessionUser } from "../modules/auth/session.js";

// ขยาย type ของ Request ให้มี user หลังผ่าน middleware นี้
declare module "express-serve-static-core" {
  interface Request {
    user?: SessionUser;
    sessionId?: string;
  }
}

// Authentication: "คุณคือใคร" — ยังไม่ตัดสินว่าทำอะไรได้ (นั่นคือ authorization ใน step 3)
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) return next(new HttpError(401, "unauthenticated"));

  const user = await findUserBySession(sessionId);
  if (!user) return next(new HttpError(401, "unauthenticated")); // หมดอายุ / logout แล้ว / ปลอม

  req.user = user;
  req.sessionId = sessionId;
  next();
};
