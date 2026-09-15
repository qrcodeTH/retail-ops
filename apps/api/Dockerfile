# ---- build stage: has dev deps + TypeScript compiler ----
FROM node:22-bookworm-slim AS build
RUN corepack enable
WORKDIR /repo
# copy manifests first so dependency install is cached when only source changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @retail-ops/api
COPY apps/api apps/api
RUN pnpm --filter @retail-ops/api build

# ---- runtime stage: only compiled JS + production deps ----
FROM node:22-bookworm-slim
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --filter @retail-ops/api
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY apps/api/migrations apps/api/migrations
WORKDIR /repo/apps/api
# run as non-root: if the app is compromised, the attacker is not root in the container
USER node
EXPOSE 3000
# migrate first, then serve. If migration fails the container exits and never serves a broken schema.
# SEED_ON_BOOT=true also loads demo users (idempotent) — for environments without shell access.
CMD ["sh", "-c", "node dist/migrate.js && { [ \"$SEED_ON_BOOT\" = true ] && node dist/seed.js || true; } && node dist/server.js"]
