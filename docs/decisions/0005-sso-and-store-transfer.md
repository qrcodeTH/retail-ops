# 0005 — Requirement change: corporate SSO + same-day store transfers (design only)

**Status:** designed, not implemented. The password login stays for the demo; this card records what would change and what was verified.

**New requirements:** (1) employees log in with the company SSO, no separate password; (2) when HR transfers an employee, the old store's access must end the same day, with no window where both stores are visible.

**What changes**
- Login: redirect to the company IdP (OIDC), receive an ID token, find-or-create the `users` row by `sso_subject`, then issue **our own session exactly as today**. SSO replaces "verify password", not "create session".
- `users`: drop `password_hash`, add `sso_subject` (stable IdP id — emails can change). `POST /auth/users` goes away; users are provisioned on first SSO login.
- `store_id` source of truth moves to HR. Options: (a) HR pushes changes (webhook / SCIM) → we update `users.store_id`; (b) read a store claim from the ID token at login — stale until next login, fails "same day" with 7-day sessions unless sessions are shortened. Choose (a), fall back to (b) + short sessions if HR cannot push.

**What does not change**
- `require-auth`, the cookie, `session.ts`, every rule in `domain.ts`, every query's `WHERE store_id = …`.
- Reason: the session stores only an id and JOINs `users` on every request, so `store_id` is never cached in the session.

**Evidence:** with a live session cookie, one `UPDATE users SET store_id` made `/me` report the new store, `/tasks` list only the new store, and the old store's task return 404 — no logout, no code change.

**Trade-off made visible:** a JWT carrying `storeId` would have kept showing the old store until expiry. This is the "revisit when" of decision 0002 confirmed from the other direction.

**Revisit when:** the IdP must be the only session authority (then use short JWTs from the IdP + a revocation check), or several apps need shared sessions.
