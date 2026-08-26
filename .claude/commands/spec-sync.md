# /spec-sync

Run a complete Spec Sync (reconciliation) pass for a backend feature, aligning all upstream specs (FRD, TDD, issue ticket) with the actual implementation and ensuring the closed-loop pipeline stays true.

## When to use

- **After code lands and is reviewed** (highest-yield pass; implementation has just discovered new truth)
- **After any downstream artifact is produced** (runtime docs, tests, swagger) — they often surface facts the specs still get wrong
- **Before merging a feature branch** — so shipped specs match shipped code

## What it does

Reads the current implementation (schema, constants, validations, routes, services, workers) and diffs it against the FRD, TDD, and issue ticket across the drift-prone checklist (status enum, transitions, validation semantics & limits, error messages/codes, endpoint inventory, permissions, async/queue behavior).

Then patches each artifact toward its source of truth, collapses duplicated facts into references, stamps docs with `Last reconciled` lines, and reports all DRIFT/GAP/STALE-REF items and any code-vs-approved-spec conflicts.

## Usage

```
/spec-sync <feature-name>
```

Example:
```
/spec-sync api-keys
/spec-sync user-preferences
```

## The full prompt

> Run Spec Sync for `<feature>`. Read the current schema, constants, validations, routes, services, and worker. Diff the implementation against the FRD, TDD, and issue ticket across the drift-prone checklist (status enum, transitions, validation semantics and limits, error messages/codes, endpoint inventory, permissions, async/queue behavior). Patch each artifact toward its source of truth per the ownership table, collapse duplicated facts into references, stamp each doc with a `Last reconciled` line, and report all DRIFT/GAP/STALE-REF items and any code-vs-approved-spec conflicts that need a product decision.

## Reference

For the full Spec Sync methodology, drift-prone checklist, ownership rules, and quality bar, read:

- **Instruction file:** `apps/backend/docs/instructions/spec-sync.instructions.md`
- **Related guides:**
  - FRD authoring: `apps/backend/docs/instructions/frd-creation.instructions.md`
  - TDD authoring: `apps/backend/docs/instructions/technical-design-doc-guide.instructions.md`
  - Runtime docs: `apps/backend/docs/instructions/technical-doc-guide.instructions.md`
  - Swagger docs: `.claude/commands/add-swagger-doc.md`
