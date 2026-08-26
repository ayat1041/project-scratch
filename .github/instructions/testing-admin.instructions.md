---
description: "Admin app testing standards for dashboard flows and permission-sensitive UI."
applyTo: "apps/admin/**/*.test.{ts,tsx}"
---

# Testing Standards - Admin

## Runner

- Use Jest and existing admin testing utilities.

## Coverage Expectations

- For list/table pages, cover empty, loading, error, and populated states.
- For filters/sort/pagination, cover query-state and result updates.
- For mutation flows, cover success, validation error, and permission-denied behavior.
- For role-sensitive actions, verify hidden/disabled/blocked behavior as designed.

## Quality Rules

- Prefer behavior-focused assertions over implementation detail checks.
- Keep mocks constrained to boundaries (network/time), not core rendering behavior.
- Keep tests deterministic and avoid flaky async timing patterns.
