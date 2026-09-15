import pg from "pg";
import { config } from "./config.js";

// Pool = a set of connections kept open and reused across requests.
// Opening a new TCP connection per request is expensive (handshake + auth with Postgres).
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // If the DB is unreachable, fail within 2 s instead of letting the request hang forever
  connectionTimeoutMillis: 2_000,
});

// An idle connection in the pool can be dropped by the DB (restart, network blip).
// Without this handler Node treats it as an unhandled error and the whole process dies.
pool.on("error", (err) => {
  console.error("idle db client error (pool will reconnect on next query):", err.message);
});
