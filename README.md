# retail-ops

Retail branch operations system — a learning project built one product at a time on a single codebase.

| Product | Status | What it exercises |
|---|---|---|
| P1 branch-tasks — task assignment per store | 🟡 API live, UI pending | auth, authorization, modular monolith, hexagonal, CI, Docker, deploy |
| P2 event dashboard | planned | outbox, Redis Streams, consumer, read model |
| P3 AI shelf check | planned | Node/Python boundary, async inference, human fallback |
| P4 mobile offline | planned | React Native, SQLite, sync |

## Live

API: https://retail-ops-api.onrender.com/health (free tier — first request after idle takes ~15 s)

Demo users (password `password123`): `manager.bkk@retail.test`, `staff.bkk@retail.test`, `manager.cnx@retail.test`, `staff.cnx@retail.test`

## Run

```sh
pnpm install
cp .env.example .env
pnpm db:up          # PostgreSQL 16 in Docker
pnpm db:migrate
pnpm db:seed
pnpm dev:api        # http://localhost:3000/health
pnpm --filter @retail-ops/api test   # 12 unit tests, no DB needed
```

CI on every push: typecheck → unit tests → migrations on a clean Postgres → HTTP smoke test → Docker build. Deploy: `render.yaml` Blueprint, redeploys on push to `main`.

## Layout

```
apps/api        Node + TypeScript + Express
apps/web        (P1 step 6) React + Vite
services/       (P3) Python AI service
docs/decisions  decision cards — why each choice was made, and what would change it
```

Decision cards: [docs/decisions](docs/decisions)
