# 0006 — Slow task list: paginate first, no Redis

**Requirement / problem:** a large store has ~20,000 tasks; the list page takes seconds to open. "Should we add Redis?"

**Measured before changing anything (20,002 rows, localhost):**
| Where | Time |
|---|---|
| Postgres, fetch + sort (index already used) | 8 ms |
| Whole request | ~185 ms |
| Response size | 4.0 MB |

The database was not the bottleneck: ~95 % of the time was serialising 20,002 objects and moving 4 MB, and the browser still had to render them. On a store 4G connection 4 MB alone is ~2 s. A cache would serve the same 4 MB faster from Redis and change nothing downstream.

**Options:** A) Redis cache of the list  B) offset pagination (`LIMIT/OFFSET`)  C) keyset pagination (`id < cursor LIMIT n`) + composite index
**Chosen:** C
**Because:** nobody reads 20,000 rows on one screen; keyset stays O(page) as the table grows and does not skip/duplicate rows when tasks are inserted between pages (offset does); the server caps `limit` at 100 so a client cannot request the old behaviour. Composite index `(store_id, id DESC)` lets Postgres walk straight to the page.
**Accepted downsides:** clients must follow the cursor (`nextBefore`) instead of a page number; "jump to page 37" is not supported (not a requirement).

**Measured after:** 50 rows, **10 KB, 4–10 ms** end to end (~40× less time, ~400× less data). DB plan: index scan, 0.16 ms. Unit test covers cursor walking; `limit=20000` → 400.

**Why not Redis:** it would not have reduced the 4 MB, and tasks change state constantly (claim/complete) so every write would need cache invalidation — complexity with no problem left to solve.
**Revisit when:** measurement shows the DB itself is the bottleneck for *repeated identical reads* (e.g. a dashboard hit thousands of times a minute) — then a short-TTL cache or a read model (P2) is justified.
