# 0002 — Server-side sessions (cookie) instead of JWT for P1

**Requirement / problem:** after login the server must know who each subsequent request is from, and "staff leaves / moves store" must take effect immediately.
**Options:** A) server-side session: random id stored in the DB + HttpOnly cookie  B) JWT: signed user data held by the client
**Chosen:** A
**Because:** logout/revocation = delete one row, effective immediately (verified: the old cookie gets 401 after logout); a single server needs no shared signing secret; an HttpOnly cookie cannot be read by page JavaScript; no refresh-token machinery.
**Accepted downsides:** one DB lookup per request; multiple API instances would have to share the session store; a mobile app has to manage the cookie itself (or send the id in a header).
**Evidence:** curl: login → HttpOnly cookie → /me 200 → logout → same cookie 401.
**Revisit when:** several services must verify identity without sharing a session store, or session lookup becomes a measured bottleneck → consider short-lived JWT + refresh token, or a Redis session cache.
