// Errors thrown by business rules. They know nothing about HTTP status codes —
// that mapping belongs to the HTTP adapter and lives in app.ts, in one place.
export type DomainErrorCode = "not_found" | "forbidden" | "invalid_transition";

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message?: string) {
    super(message ?? code);
  }
}
