---
description: Add a component to a frontend module's components/ layer (L2) — presenter, zone section, table row, action, dialog, or form.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Component (L2)

## Step 1 — Pick the role

| Role | Location | Owns |
|---|---|---|
| Presenter | `components/pages/<Entity>Presenter.tsx` | Layout composition only |
| Page (profile pattern) | `components/pages/<Domain>Page.tsx` / `PageServer.tsx` | Client edit view / server read view |
| Zone section | `components/(<zone>)/<Name>Section.tsx` | One UI region |
| Table row | `components/(<entity>)/<Entity>TableRow.tsx` | One row |
| Action | `components/(<entity>)/<Action>.tsx` | One mutation + its confirm dialog, row **and** bulk |
| Dialog | `components/dialogs/<Entity>ModalDialog.tsx` | Controlled, presentational |
| Form field | sibling folder named after the parent dialog | One input group |

## Step 2 — Gather inputs

- Target module, role, component name
- Data source: which hook, or which props
- Mutations it triggers: which handler(s)
- Does it need client interactivity?

## Step 3 — Required reading

- Skill `frontend-components`
- Skill `frontend-error-handling` (if it submits a form or triggers a mutation)
- The module's `utils/testids.ts`

## Step 4 — Write it

- **One component per file.** A named, multi-line function with its own props interface that returns JSX goes in its own file, in a sibling folder named after the parent (`timezone-dialog/TimezoneRow.tsx`). A `.map()` callback returning inline JSX does not count.
- `'use client'` only for state, effects, event handlers, browser APIs, or context consumption. Default is a Server Component.
- **Reads** come from a hook or from props. **Mutations** call a handler. Never a service, never `api/`, never `fetch`.
- Never import `sonner`. The one exception is a purely client-side business rule with no API call (`toast.error('Only one contact allowed')`).
- No prop the component does not itself read. If it is pure pass-through, use a context (static subtree data), a bundled object prop (necessary boundary), or `children` composition.
- Presenters own layout and nothing else — no fetching, no selection state, no business logic.
- An action with both row and bulk triggers is **one** component parameterised by the id list; `isBulk = ids.length > 1` drives copy, variant, and test ids.
- Filters, search, and pagination write to the URL via the shared `Filter` / `Pagination` from `@repo/ui`. Never `useState`.
- `ApiResponse<T>` narrowed with `if (response.success)` before reading `.data`.

## Step 5 — Dialogs

```typescript
const NameEditDialog = dynamic(() => import('./NameEditDialog'));
```

Every modal not needed for first paint is dynamically imported. Dialogs are controlled and presentational: `open` / `onOpenChange` in, callbacks out; the parent owns open state and calls the handler.

## Step 6 — Forms

React Hook Form + `zodResolver`, with the schema **VALUE** from `@repo/schemas-types` (plain `import`, not `import type` — that compiles and throws at runtime). Field errors render from `formState.errors.<field>.message`. A global form error lives in local `useState<string | null>`.

## Step 7 — Test IDs

Add every new `data-testid` to `utils/testids.ts` first, as an `as const` group, then reference the constant. Row-level ids use a `_PREFIX` constant concatenated with the row id. Never inline a raw string.

## Step 8 — After a mutation

```typescript
clearSelection();                                             // when bulk
queryClient.invalidateQueries({ queryKey: [FEATURE_QUERY_KEY] });
```

Prefer `invalidateQueries` over `refetch` when summaries or counts must refresh with the rows. Use the section context's `invalidate*` helper when one exists.

## Step 9 — Verify

```bash
pnpm --filter frontend lint
pnpm --filter frontend check-types
pnpm --filter frontend build
```

## Step 10 — Report

- Component, file path, role.
- Hook/handler it talks to.
- Test IDs added.
- Next: `/frontend-page`, or `/frontend-test`.
