# Single Dockerfile for all frontend environments — build context must be the
# repo root (`../../` relative to this file's compose caller), never
# apps/frontend/, since it needs the workspace's packages/ and lockfile.
#
# @repo/ui and @repo/styles are NOT built here — next.config.ts declares them
# in `transpilePackages`, so Next.js transpiles them from source directly.
# Only @repo/constants, @repo/utilities, @repo/schemas-types ship a compiled
# dist/ and need a build step.
#
# Targets:
#   dev      - live-reload local dev (docker-compose.dev.yml), source is
#              volume-mounted at runtime.
#   builder  - runs `next build`; not used directly.
#   runtime  - minimal standalone image for dev/staging/production deploys
#              (default target — last stage, used when no --target is given).

# -------- base: shared workspace setup --------
FROM node:22-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm@9.0.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# -------- dev: live-reload local development --------
FROM base AS dev
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @repo/constants build
RUN pnpm --filter @repo/utilities build
RUN pnpm --filter @repo/schemas-types build

WORKDIR /usr/src/app/apps/frontend
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# -------- builder: compiles workspace packages + runs next build --------
FROM base AS builder
RUN pnpm install
RUN pnpm --filter @repo/constants run build
RUN pnpm --filter @repo/utilities run build
RUN pnpm --filter @repo/schemas-types run build

WORKDIR /usr/src/app/apps/frontend
RUN pnpm run build

# -------- runtime: minimal standalone image for dev/staging/production --------
FROM node:22-alpine AS runtime
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# `output: standalone` traces and bundles the required node_modules itself —
# no separate prod `pnpm install` needed for this stage.
COPY --from=builder /usr/src/app/apps/frontend/.next/standalone ./
COPY --from=builder /usr/src/app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /usr/src/app/apps/frontend/public ./apps/frontend/public

USER nextjs
EXPOSE 3000

WORKDIR /usr/src/app/apps/frontend
CMD ["node", "server.js"]
