# 0004 — Deploy as a Docker container on Render (PaaS)

**Requirement / problem:** The API must be reachable at a public URL for demos, redeploy on every push, and cost nothing. It is a long-running process (connection pool now; a stream consumer in P2), and a Python service will join in P3.
**Options:** A) PaaS running a container (Render / Fly.io / Railway)  B) Serverless functions (Vercel / Lambda)  C) Raw VM (EC2 / Droplet) with nginx + certbot
**Chosen:** A — Render, Blueprint in `render.yaml`
**Because:** B kills the process between requests, which breaks `pg.Pool` and makes a forever-running consumer impossible; C means owning OS patches, TLS, restarts and logs for a learning project. Render builds the Dockerfile, terminates TLS, restarts on crash, and injects `DATABASE_URL` from a managed Postgres it also creates — all declared in one versioned file. Region Singapore for latency from Thailand.
**Accepted downsides:** Free tier sleeps after 15 min idle (cold start ~10–30 s), free Postgres expires after 30 days with no backups, no shell access (hence `SEED_ON_BOOT`). None acceptable for a real production system; all acceptable for a demo.
**Evidence:** All acceptance checks pass against https://retail-ops-api.onrender.com (login/403/404/409/claim/complete/logout-revocation); cookie carries `Secure` in production; fresh DB migrated + seeded by the container on first boot.
**Revisit when:** the project needs to stay up past 30 days (upgrade DB or move), needs zero cold start, or needs a private network between services (Fly.io or a cloud VPC). The Dockerfile is the portable part — the same image runs anywhere.
