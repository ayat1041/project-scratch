# Single Dockerfile for all backend environments — build context must be the
# repo root (`.` relative to this file's compose caller is `../../`), never
# apps/backend/, since it needs the workspace's packages/ and lockfile.
#
# Targets:
#   dev      - live-reload local dev (docker-compose.dev*.yml), source is
#              volume-mounted at runtime; this stage only needs deps installed.
#   builder  - compiles workspace packages + backend; not used directly.
#   runtime  - minimal compiled image for dev/staging/production deploys
#              (default target — `docker build` with no --target uses this,
#              since it's the last stage).

# -------- base: shared workspace setup --------
FROM node:22-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm@9.0.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend ./apps/backend

# -------- dev: live-reload local development --------
FROM base AS dev
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @repo/constants build
RUN pnpm --filter @repo/utilities build
RUN pnpm --filter @repo/schemas-types build

WORKDIR /usr/src/app/apps/backend
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=development
EXPOSE 8000
CMD ["pnpm", "run", "dev"]

# -------- builder: compiles workspace packages + backend --------
FROM base AS builder
RUN pnpm install
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm --filter @repo/constants run build
RUN pnpm --filter @repo/utilities run build
RUN pnpm --filter @repo/schemas-types run build

WORKDIR /usr/src/app/apps/backend
RUN pnpm run build

# -------- runtime: minimal image for dev/staging/production deploys --------
FROM node:22-alpine AS runtime
WORKDIR /usr/src/app
RUN npm install -g pnpm@9.0.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --prod --ignore-scripts

COPY --from=builder /usr/src/app/packages/constants/dist ./packages/constants/dist
COPY --from=builder /usr/src/app/packages/utilities/dist ./packages/utilities/dist
COPY --from=builder /usr/src/app/packages/schemas-types/dist ./packages/schemas-types/dist
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist

RUN chown -R node:node /usr/src/app
USER node

WORKDIR /usr/src/app/apps/backend
EXPOSE 8000
# Overridden at `docker run` time by the deployed .env content
# (dev/staging/production) — this is only the image's fallback default.
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
