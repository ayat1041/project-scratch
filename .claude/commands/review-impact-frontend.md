---
description: Analyze impact of a changed frontend file and identify likely stale tests and related shared contracts.
allowed-tools:
  - Read
  - Bash
---

# Review Frontend Impact

## Step 1 - Resolve changed file

If no changed file path is provided, ask for it and stop.

## Step 2 - Classify file

Classify by suffix/path:

- page/layout/route file
- component
- hook
- utility
- API client

State classification before proceeding.

## Step 3 - Find likely impacted tests

1. Check same folder for related `*.test.ts` / `*.test.tsx` files.
2. Check feature-level test folders for impacted behavior.
3. Note missing tests if behavior changed without a matching test.

## Step 4 - Contract impact

If request/response shape changed, find likely impacted shared contracts in `packages/types` and `packages/validations`.

## Step 5 - Report

Return:

## Impact Report: <filename>

### Classification

<role>

### Tests

Status: <EXISTS | NOT FOUND>

- <test file + likely stale/ok note>

### Shared Contracts

Status: <IMPACTED | NO IMPACT>

- <contract file(s) or reason>

### Recommended Actions

1. <action>
2. <action>
