# Starter Monorepo

A production-grade starter template: pnpm/Turborepo monorepo with an Express + Drizzle/PostgreSQL backend, two Next.js 15 apps (a public frontend and an admin panel), shared packages, Docker for local dev, a GitHub Actions CI/CD pipeline, and a full Claude Code setup (agents, slash commands, skills, and architecture instructions) ready to use from the first commit.

It ships with exactly the scaffolding every project needs — users, roles, permissions, auth (signup/signin/password-reset/email-verification), an audit log, and generic geo/lookup tables (countries/states/cities/languages/timezones) — and nothing else. No business domain is baked in.

## 🚀 Running the project locally

Working `.env` files (dev-only dummy credentials, matching the compose files below) are already committed at `apps/backend/.env`, `apps/frontend/.env`, and `apps/admin/.env` — nothing to fill in to get a first run working. Follow these steps in order from a fresh clone:

### 1. Install dependencies and build the shared packages

```bash
pnpm install
pnpm run build:packages   # builds @repo/constants, @repo/utilities, @repo/schemas-types
```

`build:packages` has to run before the backend or either Next.js app can resolve those packages' compiled output — do this once up front (and again any time you change one of those three packages).

### 2. Start the backend's Docker services

```bash
cd apps/backend
docker compose -f docker-compose.dev.yml up --build      # Linux/macOS
# or, on Windows:
docker compose -f docker-compose.dev.windows.yml up --build
```

This brings up Postgres, Redis, RabbitMQ, Mailhog, and the API itself (`app-dev`, running `pnpm run dev` with hot reload via a bind mount). The Windows variant is a leaner subset (skips nginx and the Prometheus/Grafana/Loki/Tempo monitoring stack, which are awkward under Docker Desktop on Windows) — use the plain `docker-compose.dev.yml` on Linux/macOS if you want the full stack including monitoring. Wait for `app-dev` to report healthy (`docker compose ps`) before continuing.

### 3. Generate and run the database migration, then seed

In a second terminal, exec into the running API container:

```bash
cd apps/backend
docker compose -f docker-compose.dev.yml exec app-dev sh
```

Then, inside the container:

```bash
npx drizzle-kit generate   # only needed after a schema change — the repo already ships an initial migration
npx drizzle-kit migrate
pnpm run seed               # optional: seeds roles/permissions/countries/states/cities/languages/timezones
exit
```

(`docker compose exec <service>` works the same way regardless of which compose file you used in step 2 — no need to look up a container name.)

### 4. Start the frontend and admin dev servers

```bash
cd apps/frontend && pnpm run dev   # http://localhost:3000
cd apps/admin && pnpm run dev      # http://localhost:4000
```

### Where everything ends up

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Admin | http://localhost:4000 |
| Backend API | http://localhost:8000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |
| RabbitMQ management UI | http://localhost:15672 (`starter` / `starterRabbit123`) |
| Mailhog (catches dev emails) | http://localhost:8025 |
| Grafana / Prometheus / Loki / Tempo (non-Windows only) | http://localhost:3001, :9090, :3100, :3200 |

If everything above is reachable, the project is fully operable end to end — signup/signin, email verification (via Mailhog), and the admin panel's user/role/permission management all work against the same local stack.

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
3. `apps/{backend,frontend,admin}/.env` already exist with working local-dev values (see "Running the project locally" above) — for a real deployment, replace them with real values (and copy `infra/monitoring/.env.example` → `.env` too). Never commit `.env` or unencrypted `*_vault.yml` files.
4. Set up `infra/ansible/inventory/hosts.yml` and `host_vars/app.yml` for your real server(s), and configure the GitHub Actions secrets/variables listed above.
5. Run `pnpm --filter backend run db:generate` after your first schema change to produce the initial migration, then `db:migrate` and `seed`.
6. Start building your domain modules following the patterns in `.claude/skills` — `backend-architecture`, `frontend-architecture`, and `admin-architecture` are the entry points.

---

Built by Softeko Team
