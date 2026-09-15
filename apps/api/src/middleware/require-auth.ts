import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { SESSION_COOKIE, findUserBySession, type SessionUser } from "../modules/auth/session.js";

// Extend Express's Request type so req.user exists after this middleware
declare module "express-serve-static-core" {
  interface Request {
    user?: SessionUser;
    sessionId?: string;
  }
}

// Authentication: "who are you?" — it does not decide what you may do (that is authorization, inside each module)
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) return next(new HttpError(401, "unauthenticated"));

  const user = await findUserBySession(sessionId);
  if (!user) return next(new HttpError(401, "unauthenticated")); // expired, logged out, or forged

  req.user = user;
  req.sessionId = sessionId;
  next();
};
