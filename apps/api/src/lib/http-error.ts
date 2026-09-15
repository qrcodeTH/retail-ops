// An error we intentionally return to the client with a specific status code.
// Distinct from a plain Error (a bug), which must become a 500 without leaking details.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}
