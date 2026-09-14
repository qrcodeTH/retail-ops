# retail-ops

ระบบงานสาขาค้าปลีก — learning project สร้างทีละ product บน codebase เดียว

| Product | สถานะ | สิ่งที่ฝึก |
|---|---|---|
| P1 branch-tasks — มอบหมายงานสาขา | 🚧 in progress | auth, authorization, modular monolith, hexagonal |
| P2 event dashboard | planned | outbox, Redis Streams, consumer, read model |
| P3 AI shelf check | planned | Node/Python boundary, async inference, human fallback |
| P4 mobile offline | planned | React Native, SQLite, sync |

## Run

```sh
pnpm install
cp .env.example .env
pnpm db:up          # PostgreSQL 16 in Docker
pnpm dev:api        # http://localhost:3000/health
```

## Layout

```
apps/api        Node + TypeScript + Express
apps/web        (P1 step 6) React + Vite
services/       (P3) Python AI service
docs/decisions  decision cards — ทำไมเลือกแบบนี้ และอะไรจะทำให้เปลี่ยนใจ
```

Decision cards: [docs/decisions](docs/decisions)
