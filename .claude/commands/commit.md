---
description: Generate a commit message based on staged changes, then commit.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Generate & Commit

Analyzes staged changes and generates a conventional commit message.

## Workflow

### Step 1 — Check staged changes

```bash
git diff --cached --name-only
git diff --cached
```

If nothing is staged, ask the user to stage changes first:

```bash
git add <files>
```

Stop and ask if the user wants to stage additional files.

### Step 2 — Analyze changes

Read the diff and identify:

- **Type**: `feat`, `fix`, `refactor`, `docs`, `test`, `perf`, `chore`
- **Scope**: affected module/area (e.g., `backend`, `auth`, `invitations`)
- **Breaking change**: if yes, add `!` after scope
- **Summary**: one-line description (imperative, lowercase, max 50 chars)
- **Body**: detailed explanation if needed (optional, for complex changes)

### Step 2.5 — Check for GitHub issue linking

Ask the user:

```
Link to a GitHub issue? (y/n)
```

If yes, ask for the issue number:

```
Enter the GitHub issue number (e.g., 19):
```

Store the issue number for the message format.

### Step 3 — Generate message

Follow conventional commits format. If linking to a GitHub issue, include it after the scope:

```
<type>(<scope>): #<issue-number> <summary>

<optional body>

```

Or without issue link:

```
<type>(<scope>): <summary>

<optional body>

```

Examples with issue links:

```
fix(backend): #42 resolve email verification status filter on expired tokens

Previously, the status filter was using createdAt instead of expiresAt,
causing expired verification tokens to not be filtered correctly.

feat(admin): #19 add bulk role export to CSV

refactor(backend): #7 simplify middleware chain for auth routes
```

Examples without issue links:

```
fix(backend): resolve email verification status filter on expired tokens

feat(admin): add bulk role export to CSV

refactor(backend): simplify middleware chain for auth routes

docs(api): update permissions endpoint examples
```

### Step 4 — Present & confirm

Show the generated message to the user and ask:

```
✓ Generated commit message:

<message>

Proceed with commit? (y/n)
```

If user says no, ask if they want to:

- Edit the message
- Cancel and stage different files
- Edit the message

### Step 5 — Commit

If confirmed, run:

```bash
git commit -m "<message>"
```

If successful, show:

```
✓ Committed!
<commit hash>
```

## Commit Type Guide

- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code change that doesn't add features or fix bugs
- **docs**: Documentation changes
- **test**: Adding/updating tests
- **perf**: Performance improvement
- **chore**: Build, deps, or tooling changes
- **ci**: CI/CD changes

## Scope Guide (by file location)

- `backend`: changes in `apps/backend/src/`
- `frontend`: changes in `apps/frontend/`
- `admin`: changes in `apps/admin/`
- `types`: changes in `packages/types/`
- `validations`: changes in `packages/validations/`
- `db`: database schema or migrations
- `e2e`: changes in `apps/e2e-backend/`
