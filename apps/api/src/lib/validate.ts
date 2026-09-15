import type { ZodType } from "zod";
import { HttpError } from "./http-error.js";

// The point where data crosses the trust boundary: JSON from an unknown sender → an object whose shape we have verified.
// TypeScript cannot help here (its types are gone at runtime); that is why zod exists.
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, "validation_error", result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return result.data;
}
