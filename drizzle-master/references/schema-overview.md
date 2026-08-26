# Drizzle Schema Overview

This codebase uses a modular schema structure organized by domain.

## Directory Structure

`apps/backend/src/db/schema/`

- **`user-management/`**: Core authentication and authorization.
  - `app_users.ts`: Primary user table.
  - `app_roles.ts`, `app_permissions.ts`, `app_permissions_roles.ts`: RBAC system.
  - `app_user_roles.ts`, `app_user_refresh_tokens.ts`, `app_email_verification_tokens.ts`: user/role links, sessions, verification.
- **`common-tables/`**: Shared lookups and cross-cutting records — `app_countries.ts`, `app_states.ts`, `app_cities.ts`, `app_languages.ts`, `app_timezones.ts`, `app_activity_logs.ts` (audit trail).

Add a new domain folder under `schema/` per feature area as the project grows (mirroring `packages/schemas-types/src/tables/`), following the same naming/prefix conventions below.

## Key Design Patterns

### 1. Table Naming

All tables are prefixed with `app_`.

### 2. UUIDs

Primary keys use `uuid` with `defaultRandom()`.

### 3. Timestamps

Standard columns for tracking:

- `createdAt`: `timestamp("created_at").defaultNow().notNull()`
- `updatedAt`: `timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date())`

### 4. Relations

Relations are defined in `apps/backend/src/db/schema/relations.ts` using the `relations` API from `drizzle-orm`.
