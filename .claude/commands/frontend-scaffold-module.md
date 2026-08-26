---
description: Scaffold a frontend feature module under apps/frontend/modules with the correct layer folders for pattern 4A, 4B, or 4C.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
---

# Scaffold Frontend Module

## Step 1 — Gather inputs

- Domain, feature name (kebab-case), pattern (4A / 4B / 4C)
- The entity name in PascalCase (drives file and symbol names)
- Whether the feature mutates (decides `handlers/`)
- Whether the backend owns all validation (decides whether `validations/` exists at all)

If `/frontend-plan-feature` produced a plan, take the answers from it. Otherwise ask.

## Step 2 — Required reading

- Skill `frontend-architecture` (folder shape, patterns)
- Skill `frontend-naming` (every file name below)

## Step 3 — Refuse to duplicate

Check `apps/frontend/modules/<domain>/` and `module-directory.instructions.md`. If the feature exists, stop and report where it lives.

## Step 4 — Create the folders

Under `apps/frontend/modules/<domain>/<feature>/`. Layer folders are lowercase with **no underscore prefix**.

**Pattern 4C — Lightweight List-Page** (ref `modules/user-management/user-preferences/`):

```
api/api-constants.ts
api/<feature>-api.ts
services/<feature>-service.ts
handlers/<feature>.handlers.ts
constants/constants.ts
utils/helpers.ts
utils/testids.ts
validations/<entity>.schema.ts      omit if the backend owns validation
components/(header)/index.tsx
components/(filter)/index.tsx
components/(table)/<Entity>Table.tsx
components/(table)/<Entity>TableHeader.tsx
components/(table)/<Entity>Dialogs.tsx
components/AddAndEdit<Entity>.tsx
components/Presenter.tsx
```

**Pattern 4B — Standalone CRUD** (ref `modules/user-management/api-keys/`):

```
api/api-constants.ts
api/<feature>-api.ts
services/<feature>-management-service.ts
handlers/<area>.handlers.ts
hooks/use<Entity>Query.ts
hooks/use<Entity>QueryParams.ts
types/domain.ts
utils/helpers.ts
utils/testids.ts
components/(header)/SearchSection.tsx
components/(header)/Add<Entity>.tsx
components/(header)/TabSection.tsx
components/(<entity>)/<Entity>SectionContext.tsx
components/(<entity>)/FilterSection.tsx
components/(<entity>)/BulkActions.tsx
components/(<entity>)/TableSection.tsx
components/(<entity>)/<Entity>TableRow.tsx
components/dialogs/<Entity>ModalDialog.tsx
components/pages/<Entity>Presenter.tsx
```

**Pattern 4A — Full-Stack Profile** (ref `modules/user-management/profile/`):

```
api/api-constants.ts
api/<domain>-api.ts
services/<domain>-profile-service.ts
services/index.ts
handlers/<area>.handlers.ts
handlers/index.ts
hooks/use<Feature>.ts
hooks/index.ts
types/domain.ts
validations/schemas.ts
constants/
utils/helpers.ts
utils/testids.ts
components/pages/<Domain>Page.tsx
components/pages/<Domain>PageServer.tsx
components/sections/<section-name>/<Domain><Name>Section.tsx
components/shared/
```

Add a `services/index.ts` or `handlers/index.ts` barrel only when the folder has more than one file.

## Step 5 — Stub contents

Every file gets a real, compiling stub — not an empty file:

- `api-constants.ts` — an `as const` `<DOMAIN>_<FEATURE>_ENDPOINTS` object with the planned path-only builders.
- `<feature>-api.ts` — imports `fetchWithCookies`, `createApiError`, `ApiResponse`; one exported async function per planned endpoint, body `throw new Error('Not implemented');`.
- `<feature>-service.ts` — `import * as api from '../api/<feature>-api';` plus one exported async function per planned service call, same stub body.
- `<feature>.handlers.ts` — `import { toast } from 'sonner';` + `handleErrorToast`, one `handle<Action><Entity>` per mutation with the full try/toast/catch/re-throw skeleton already in place.
- `utils/testids.ts` — one `as const` group per planned UI zone, even if empty.
- Components — a default-exported component returning a placeholder, one component per file.

Stubs must satisfy `pnpm --filter frontend check-types`.

## Step 6 — Register

Add the module to `apps/frontend/instructions/module-directory.instructions.md` under its domain, with the pattern label and a status marker.

## Step 7 — Verify

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
```

## Step 8 — Report

- Files created, grouped by layer.
- Layers deliberately omitted, and why.
- Next: `/frontend-contract` (if contracts are missing), then `/frontend-api`.
