# AGENTS.md (apps/backend/scripts scope)

Codex/agents: before editing anything under this folder, read
[../../.github/instructions/backend-scripts.instructions.md](../../../.github/instructions/backend-scripts.instructions.md).

Hard rules (summary):

- Scripts must be runnable via an npm script in `apps/backend/package.json`.
- TypeScript runs under `tsx`; wrap async work in `main()` and call it.
- Set a non-zero exit code on failure.
- Never import from `apps/backend/src/app/*` or boot the HTTP server.
- DB/Redis access must close connections before exit.
- Never log secrets, tokens, full request bodies, or PII.
