import argon2 from "argon2";

// argon2id: deliberately slow, with a random salt embedded in the hash string.
// We never implement the algorithm ourselves — standard library only.
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
