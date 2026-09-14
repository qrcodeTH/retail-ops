import argon2 from "argon2";

// argon2id: ช้าโดยตั้งใจ + salt สุ่มฝังใน hash string
// เราไม่เขียนอัลกอริทึมเอง ใช้ไลบรารีมาตรฐานเท่านั้น
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
