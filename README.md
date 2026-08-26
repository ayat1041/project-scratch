# Starter Monorepo

A production-grade starter template: pnpm/Turborepo monorepo with an Express + Drizzle/PostgreSQL backend, two Next.js 15 apps (a public frontend and an admin panel), shared packages, Docker for local dev, a GitHub Actions CI/CD pipeline, and a full Claude Code setup (agents, slash commands, skills, and architecture instructions) ready to use from the first commit.

It ships with exactly the scaffolding every project needs — users, roles, permissions, auth (signup/signin/password-reset/email-verification), an audit log, and generic geo/lookup tables (countries/states/cities/languages/timezones) — and nothing else. No business domain is baked in.

## 🚀 Quick Start

```bash
# Install
pnpm install

# Backend dev (Docker — Postgres, Redis, RabbitMQ, the API)
cd apps/backend && docker compose -f docker-compose.dev.yml -p starter-api-dev up

# Frontend dev
cd apps/frontend && pnpm run dev

# Admin dev
cd apps/admin && pnpm run dev
```

## 📁 Structure

```
├── apps/
│   ├── backend/      # Express 5 + Drizzle/PostgreSQL API, Docker Compose, migrations
│   ├── frontend/     # Next.js 15 public app
│   └── admin/        # Next.js 15 admin panel
├── packages/
│   ├── ui/                # Shared React components (shadcn-style primitives + layout shell)
│   ├── schemas-types/     # Drizzle table schemas, Zod payload schemas, shared response types
│   ├── constants/         # Roles/permissions/routes and other cross-app constants
│   ├── utilities/         # Framework-agnostic helpers
│   ├── styles/             # Shared Tailwind globals
│   ├── eslint-config/, typescript-config/
├── infra/
│   ├── ansible/       # Server provisioning + deploy playbooks (Ansible Vault for secrets)
│   └── monitoring/    # Prometheus/Grafana/Loki/Tempo stack (docker compose)
├── .claude/            # Agents, slash commands, skills — the layered architecture reference
├── .github/
│   ├── workflows/      # CI (lint/type-check/build) + CD (build, push, SSH-deploy per app)
│   └── instructions/   # Architecture/convention docs, imported by CLAUDE.md
└── drizzle-master/     # Drizzle ORM workflow reference
```

## 🧱 What's in the box

- **Auth**: signup, signin (+ Google/LinkedIn OAuth), sign-out, session info, password reset, email verification — `apps/backend/src/modules/auth`.
- **Users, roles, permissions**: `apps/backend/src/modules/user-management`, backed by `app_users` / `app_roles` / `app_permissions` / `app_permission_to_roles` / `app_user_roles` (see `apps/backend/src/db/schema`).
- **Audit log**: `apps/backend/src/modules/common/F5008-activity-logs`.
- **Generic lookups**: countries/states/cities/languages, seeded from real datasets — `apps/backend/src/modules/common`.
- **Admin panel core**: user management, roles & permissions, audit logs, settings — `apps/admin/app/dashboard`.
- **Full layered architecture + Claude tooling**: see `CLAUDE.md` and `.claude/skills` — the same conventions used to build the source project (request-lifecycle layers, feature-folder shape, naming rules, error handling, testing patterns) apply here from day one.

## 🔄 Deployment

`.github/workflows/deploy.yml` builds and pushes a Docker image per app (backend/frontend/admin) to Docker Hub and SSH-deploys it on push to `dev` (→ dev env) or `staging` (→ staging env), only rebuilding apps whose files changed. Configure via repository **Secrets** (`DOCKERHUB_PASSWORD`, `REMOTE_HOST`, `SSH_PRIVATE_KEY`, `ENV_DEV`/`ENV_STAGING`/`FRONTEND_ENV_DEV`/`FRONTEND_ENV_STAGING`/`ADMIN_ENV_DEV`/`ADMIN_ENV_STAGING`) and **Variables** (`DOCKERHUB_USERNAME`, `DOCKERHUB_NAMESPACE`, `REMOTE_USER`).

Server provisioning (Docker, Nginx, Postgres/Redis/RabbitMQ containers, SSH/firewall hardening) is handled by the Ansible playbooks in `infra/ansible` — see `infra/ansible/VAULT.md` for the secrets workflow.

## 🛠️ Tech Stack

- **Backend**: Express 5, TypeScript, Drizzle ORM, PostgreSQL, Redis, RabbitMQ, Zod 4
- **Frontend / Admin**: Next.js 15, React 19, TypeScript, Tailwind
- **Monorepo**: pnpm, Turborepo
- **CI/CD**: GitHub Actions → Docker Hub → SSH deploy
- **Observability**: Prometheus, Grafana, Loki, Tempo (`infra/monitoring`)

## 📦 Commands

```bash
pnpm install               # Install all deps
pnpm build                 # Build everything
pnpm lint                  # Lint everything
pnpm check-types            # Type-check everything
pnpm --filter backend dev   # Run backend
pnpm --filter frontend dev  # Run frontend
pnpm --filter admin dev     # Run admin
```

See `AGENTS.md` / `CLAUDE.md` for the full command list and how the architecture skills/instructions fit together.

## ✅ Starting a new project from this template

1. Rename the root package (`package.json` `name`), and replace the `starter` prefix used for Docker container/network names (`docker-compose*.yml`, `infra/ansible/inventory/host_vars/app.yml.example`) with your project's name.
2. Optionally rename the `app_` table prefix (`apps/backend/src/db/schema`, `packages/schemas-types/src/tables`) if you want a project-specific one — it's a pure find/replace, not required.
3. Copy `.env.example` → `.env` in each app and `infra/monitoring/.env.example` → `.env`, and fill in real values. Never commit `.env` or unencrypted `*_vault.yml` files.
4. Set up `infra/ansible/inventory/hosts.yml` and `host_vars/app.yml` for your real server(s), and configure the GitHub Actions secrets/variables listed above.
5. Run `pnpm --filter backend run db:generate` after your first schema change to produce the initial migration, then `db:migrate` and `seed`.
6. Start building your domain modules following the patterns in `.claude/skills` — `backend-architecture`, `frontend-architecture`, and `admin-architecture` are the entry points.

---

Built by Softeko Team
