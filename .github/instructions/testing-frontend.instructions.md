---
description: "Frontend testing standards for Next.js UI and behavior."
applyTo: "apps/frontend/**/*.test.{ts,tsx}"
---

# Testing Standards - Frontend

## Runner

- Use Jest and existing frontend testing utilities.

## Coverage Expectations

- For data-driven components, cover loading, error, and success states.
- For forms, cover valid submit, invalid submit, and error rendering.
- For routing-sensitive UI, cover navigation/redirect behavior when applicable.
- For shared contract usage, ensure tests reflect updated schema/type expectations.

## Quality Rules

- Prefer user-observable assertions over implementation details.
- Keep mocks minimal and realistic.
- Avoid fragile timing assertions when deterministic alternatives exist.
