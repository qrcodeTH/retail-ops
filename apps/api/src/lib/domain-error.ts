// error ที่กฎธุรกิจโยน — ไม่รู้จัก HTTP status (นั่นเป็นเรื่องของ adapter ฝั่ง HTTP)
// app.ts เป็นคนแปลง code → status ที่เดียว
export type DomainErrorCode = "not_found" | "forbidden" | "invalid_transition";

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message?: string) {
    super(message ?? code);
  }
}
