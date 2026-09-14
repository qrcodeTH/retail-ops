import type { ZodType } from "zod";
import { HttpError } from "./http-error.js";

// จุดที่ข้อมูลข้าม trust boundary: JSON จากใครก็ไม่รู้ → object ที่เรารับรองรูปร่างแล้ว
// TypeScript ช่วยไม่ได้ตรงนี้ (มันหายไปแล้วตอน runtime) zod ถึงมีหน้าที่
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, "validation_error", result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return result.data;
}
