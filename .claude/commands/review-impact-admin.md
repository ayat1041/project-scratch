---
description: Analyze impact of a changed admin file and identify stale tests, permission-flow risks, and contract drift.
allowed-tools:
  - Read
  - Bash
---

# Review Admin Impact

## Step 1 - Resolve changed file

If no changed file path is provided, ask for it and stop.

## Step 2 - Classify file

Classify by suffix/path:

- page/layout/route file
- component
- table/filter module
- mutation handler
- utility/API client

State classification before proceeding.

## Step 3 - Find likely impacted tests

1. Check same folder for related `*.test.ts` / `*.test.tsx` files.
2. Check feature-level test folders for affected flows.
3. Flag missing tests for permission-sensitive or mutation changes.

## Step 4 - Permission and contract impact

1. Determine whether role/permission behavior is affected.
2. If payload shape changed, identify impacted shared contracts in `packages/types` and `packages/validations`.

## Step 5 - Report

Return:

## Impact Report: <filename>

### Classification

<role>

### Tests

Status: <EXISTS | NOT FOUND>

- <test file + likely stale/ok note>

### Permission Risk

Status: <HIGH | MEDIUM | LOW | NONE>

- <reason>

### Shared Contracts

Status: <IMPACTED | NO IMPACT>

- <contract file(s) or reason>

### Recommended Actions

1. <action>
2. <action>
