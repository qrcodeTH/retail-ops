# 0003 — Hexagonal for the tasks module only; auth stays layered

**Requirement / problem:** tasks has several rules (store scoping, role, ownership, state machine) that must be proven correct and will gain a second entry point (the event consumer in P2). Auth has few rules and is naturally tied to HTTP (cookies).
**Options:** A) layered everywhere  B) hexagonal everywhere  C) hexagonal only where there are rules
**Chosen:** C
**Because:** the tasks rules are covered by 12 unit tests that run in ~240 ms with no database (in-memory adapter), and the same use cases will be called from both HTTP and the event consumer. Making auth hexagonal would add three files of interfaces wrapping SELECT/INSERT with no rules to test.
**Accepted downsides:** tasks is 6 files instead of 2; two modules use two styles, so a newcomer needs to know why (this file is the answer); DomainError needs a code → HTTP status mapping in app.ts.
**Evidence:** `pnpm test` passes with Postgres stopped; the curl smoke test after the refactor gives identical results (201/404/409/200/200/409).
**Revisit when:** auth grows real rules (lockout after failed attempts, several SSO providers) → make it hexagonal too; or if the team finds two styles more confusing than useful → pick one.
