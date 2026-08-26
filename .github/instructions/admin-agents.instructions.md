---
description: "Core operating rules for the admin app: Next.js boundaries, auth/permission-safe UI changes, and validation commands."
applyTo: "apps/admin/**"
---

# Admin Agent Instructions

## Technology Context

- App framework: Next.js 15 + React 19
- Package manager: pnpm
- Shared packages: `@repo/ui`, `@repo/types`, `@repo/validations`, `@repo/constants`

## Runtime And Validation Commands

- From `apps/admin`: `pnpm run dev`
- From `apps/admin`: `pnpm run lint`
- From `apps/admin`: `pnpm run check-types`
- From `apps/admin`: `pnpm run build`

After admin changes, run at minimum:

- `pnpm run lint`
- `pnpm run check-types`

## Non-Negotiable Rules

- Use Server Components by default; use Client Components only for interactive behavior.
- Keep permission-sensitive UI and actions consistent with existing auth flow.
- Reuse shared types/schemas/constants instead of redefining them locally.
- Preserve existing admin UI interaction patterns unless change is requested.
- Keep changes scoped and avoid broad refactors.

## Testing Rules

- For `apps/admin/**/*.test.ts?(x)`, use Jest conventions already used in this app.
- For mutation flows, cover success, validation failures, and permission-denied paths.
- For list/filter UIs, cover empty, loading, error, and populated states.
