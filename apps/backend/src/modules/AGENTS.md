# AGENTS.md (apps/backend/src/modules scope)

Codex/agents: before adding or restructuring a feature folder here, read:

- [../../../../.github/instructions/backend-file-structure.instructions.md](../../../../.github/instructions/backend-file-structure.instructions.md)
- [../../../../.github/instructions/api-workflow.instructions.md](../../../../.github/instructions/api-workflow.instructions.md)
- [../../../../.github/instructions/backend-naming-conventions.instructions.md](../../../../.github/instructions/backend-naming-conventions.instructions.md)
- [../../../../.github/instructions/error-handling.instructions.md](../../../../.github/instructions/error-handling.instructions.md)

Feature folder layout (singletons allowed at root):

```
<feature>/
  controllers/<feature>.controller.ts
  services/<feature>.service.ts
  validations/<feature>.schema.ts
  swagger-docs/*.swagger.ts
  tests/integration/*.service.test.ts
  <feature>.routes.ts
  queries.model.ts
  policy.ts
  index.ts
```

Middleware chain for protected endpoints (exact order):

`isAuthenticated -> hasPermission -> resolveResources -> authorize -> controller`

Controllers read `res.locals.resourceData`, never query the DB. Services mutate, never re-fetch resolved data.
