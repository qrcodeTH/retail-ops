# 0001 — One monorepo for every product

**Requirement / problem:** P1–P4 extend the same system (shared auth, DB, API) and there is a single developer.
**Options:** A) monorepo `apps/*` with a pnpm workspace  B) one repo per service  C) a single Next.js full-stack app
**Chosen:** A
**Because:** an API contract change is fixed across api/web/mobile in one commit; CI/Docker are set up once; there is no team or release-cadence reason to split repos; C couples the API to Next, which makes sharing it with the mobile app (P4) harder.
**Accepted downsides:** if separate teams ever own separate parts, release pipelines will have to be split inside the repo.
**Evidence:** none yet — chosen from team constraints, not from measurement.
**Revisit when:** multiple teams need different release cadences, or a new product shares no domain with this one (e.g. ticket booking → new repo).
