# Monorepo Branching Strategy

## 🌳 Branch Structure

```
main (production)
  ↑
dev (staging - auto-deploy)
  ↑
feature/* (no auto-deploy)
hotfix/*
release/* (optional)
```

## 📋 Branch Types

### 1. **main** - Production

- **Purpose**: Stable production code
- **Protection**: Protected, requires approval
- **Deployment**: Manual or scheduled
- **Merge from**: `dev` or `hotfix/*` only

### 2. **dev** - Staging/Development

- **Purpose**: Integration and testing
- **Protection**: Protected, requires approval
- **Deployment**: ✅ **Automatic on push**
- **Merge from**: `feature/*`, `hotfix/*`
- **CI/CD**: Builds and deploys to staging servers

### 3. **feature/\*** - Feature Development

- **Purpose**: New features or enhancements
- **Protection**: Not protected
- **Deployment**: ❌ **No automatic deployment**
- **CI/CD**: ✅ Builds and tests only
- **Lifetime**: Short-lived (delete after merge)

### 4. **hotfix/\*** - Urgent Fixes

- **Purpose**: Critical production bugs
- **Protection**: Not protected
- **Deployment**: Can merge directly to `main` and `dev`
- **CI/CD**: Builds and tests

### 5. **release/\*** - Release Candidates (Optional)

- **Purpose**: Preparing for production release
- **Protection**: Protected
- **Deployment**: Manual to production
- **CI/CD**: Full build and test suite

## 🎯 Naming Conventions

### For Single-App Features

```bash
# Frontend only
feature/frontend-user-profile
feature/frontend-new-dashboard
hotfix/frontend-login-bug

# Backend only
feature/backend-api-optimization
feature/backend-new-endpoint
hotfix/backend-database-connection
```

### For Full-Stack Features

```bash
# Touches both apps
feature/user-authentication
feature/payment-integration
feature/notification-system
```

### For Package Updates

```bash
# Shared packages
feature/validations-update
feature/ui-component-library
```

## 🔄 Workflow

### Standard Feature Development

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/user-dashboard

# 2. Make changes (frontend, backend, or both)
# ... edit files ...

# 3. Commit regularly
git add .
git commit -m "feat(frontend): add user dashboard"

# 4. Push to trigger CI (builds/tests only - no deploy)
git push origin feature/user-dashboard

# 5. Create Merge Request to dev in GitLab
# Wait for CI/CD to pass (builds, tests, linting)

# 6. After approval, merge to dev
# This triggers automatic deployment to staging

# 7. Clean up
git checkout dev
git pull origin dev
git branch -d feature/user-dashboard
git push origin --delete feature/user-dashboard
```

### Frontend-Only Feature

```bash
# Create branch
git checkout -b feature/frontend-new-header

# Work only in apps/frontend/
cd apps/frontend
# ... make changes ...

# Commit and push
git add apps/frontend/
git commit -m "feat(frontend): redesign header"
git push origin feature/frontend-new-header

# When merged to dev:
# ✅ Frontend builds and deploys
# ❌ Backend does NOT deploy (path-based trigger)
```

### Backend-Only Feature

```bash
# Create branch
git checkout -b feature/backend-api-v2

# Work only in apps/backend/
cd apps/backend
# ... make changes ...

# Commit and push
git add apps/backend/
git commit -m "feat(backend): add API v2 endpoints"
git push origin feature/backend-api-v2

# When merged to dev:
# ✅ Backend builds and deploys
# ❌ Frontend does NOT deploy (path-based trigger)
```

### Hotfix Workflow

```bash
# 1. Create from main for production hotfix
git checkout main
git pull origin main
git checkout -b hotfix/backend-critical-bug

# 2. Fix the issue
# ... make minimal changes ...

# 3. Commit and push
git commit -m "fix(backend): resolve critical auth bug"
git push origin hotfix/backend-critical-bug

# 4. Merge to BOTH main and dev
# Option A: Via GitLab (create 2 MRs)
# Option B: Manually
git checkout main
git merge hotfix/backend-critical-bug
git push origin main

git checkout dev
git merge hotfix/backend-critical-bug
git push origin dev

# 5. Clean up
git branch -d hotfix/backend-critical-bug
git push origin --delete hotfix/backend-critical-bug
```

## 🚀 Deployment Flow

### Automatic Deployments (dev branch only)

```
feature/new-feature → dev → Auto Deploy to Staging
                       ↓
                     main → Manual Deploy to Production
```

### Path-Based Intelligence

```
Change apps/frontend/**  → Only frontend deploys
Change apps/backend/**   → Only backend deploys
Change packages/**       → Both frontend & backend deploy
```

## 📊 Example Scenarios

### Scenario 1: Full-Stack Feature

```bash
# Create feature branch
git checkout -b feature/payment-integration

# Work on both apps
touch apps/backend/src/modules/payments/
touch apps/frontend/app/payments/
touch packages/validations/src/payment.validations.ts

# Commit
git add .
git commit -m "feat: add payment integration"
git push origin feature/payment-integration

# CI/CD on feature branch:
# ✅ Builds backend
# ✅ Builds frontend
# ✅ Runs tests
# ❌ Does NOT deploy

# After merge to dev:
# ✅ Deploys backend to staging
# ✅ Deploys frontend to staging
```

### Scenario 2: Frontend-Only UI Update

```bash
git checkout -b feature/frontend-redesign

# Only touch frontend
cd apps/frontend
# ... changes ...

git commit -m "feat(frontend): new UI design"
git push origin feature/frontend-redesign

# After merge to dev:
# ✅ Deploys frontend only
# ⏭️ Backend skipped (no changes)
```

### Scenario 3: Shared Package Update

```bash
git checkout -b feature/validations-update

# Update shared package
cd packages/validations
# ... add new schemas ...

git commit -m "feat(validations): add new schemas"
git push origin feature/validations-update

# After merge to dev:
# ✅ Deploys backend (uses validations)
# ✅ Deploys frontend (uses validations)
# Both apps rebuild to use updated package
```

## 🛡️ Branch Protection Rules

Configure in GitLab → Settings → Repository → Protected Branches:

### main

- ✅ Protect branch
- ✅ Allowed to merge: Maintainers only
- ✅ Allowed to push: No one
- ✅ Require approval: 2+ approvals
- ✅ Require passing pipeline

### dev

- ✅ Protect branch
- ✅ Allowed to merge: Developers
- ✅ Allowed to push: No one
- ✅ Require approval: 1+ approval
- ✅ Require passing pipeline

## 📝 Commit Message Convention

Use conventional commits for clarity:

```bash
# Format: <type>(<scope>): <subject>

feat(frontend): add user dashboard
feat(backend): implement new API endpoint
fix(backend): resolve database connection issue
fix(frontend): correct form validation
docs: update README
chore(deps): update dependencies
refactor(backend): optimize query performance
test(frontend): add unit tests for components
```

### Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Scopes:

- `frontend`: Changes in apps/frontend
- `backend`: Changes in apps/backend
- `validations`: Changes in packages/validations
- `ui`: Changes in packages/ui
- `deps`: Dependency updates

## 🔀 Merge Strategy

### Feature → Dev

- Use **Squash and Merge** for clean history
- Or **Merge Commit** to preserve feature branch history

### Dev → Main

- Use **Merge Commit** to preserve deployment history
- Tag releases: `git tag -a v1.2.3 -m "Release v1.2.3"`

## ⚡ Best Practices

### 1. **Keep Branches Short-Lived**

- Feature branches should live < 1 week
- Merge to `dev` frequently
- Delete after merge

### 2. **Small, Focused Changes**

- One feature per branch
- Easy to review
- Faster deployment

### 3. **Sync Often**

```bash
# Keep feature branch up to date
git checkout feature/my-feature
git fetch origin
git rebase origin/dev
```

### 4. **Use Draft MRs**

- Create MR early as "Draft"
- CI/CD runs on every push
- Get feedback early
- Mark "Ready" when done

### 5. **Review Before Merge**

- Code review required
- Check CI/CD passes
- Test in staging after merge to `dev`

### 6. **Clean Up**

```bash
# Delete merged branches locally
git branch -d feature/merged-feature

# Delete remote branches
git push origin --delete feature/merged-feature

# Or use GitLab auto-delete feature
```

## 🎯 Quick Reference

| Branch Type | Created From | Merged To      | Auto-Deploy | Lifetime           |
| ----------- | ------------ | -------------- | ----------- | ------------------ |
| `feature/*` | `dev`        | `dev`          | ❌ No       | Short (< 1 week)   |
| `hotfix/*`  | `main`       | `main` + `dev` | ❌ No       | Very short (hours) |
| `release/*` | `dev`        | `main`         | ❌ No       | Short (days)       |
| `dev`       | -            | `main`         | ✅ Yes      | Permanent          |
| `main`      | -            | -              | Manual      | Permanent          |

## 🚦 CI/CD Behavior by Branch

```yaml
feature/* branches: ✅ Build backend
  ✅ Build frontend
  ✅ Run tests
  ❌ No deployment

dev branch: ✅ Build backend
  ✅ Build frontend
  ✅ Run tests
  ✅ Deploy to staging (path-based)

main branch: ✅ Build backend
  ✅ Build frontend
  ✅ Run tests
  ✅ Deploy to production (manual/configured)
```

## 📚 Additional Tips

### Working on Long-Running Features

```bash
# Use feature flags instead of long-lived branches
# Deploy code to dev, but hide behind flag

# In code:
if (featureFlags.newDashboard) {
  return <NewDashboard />
}
```

### Multiple Developers on Same Feature

```bash
# Create sub-branches
feature/payment-integration
  └── feature/payment-integration-frontend
  └── feature/payment-integration-backend

# Merge sub-branches to feature branch
# Then merge feature branch to dev
```

### Emergency Hotfix

```bash
# Bypass normal flow for critical issues
git checkout main
git checkout -b hotfix/critical-security
# ... fix ...
git commit -m "fix: critical security vulnerability"

# Merge immediately to main (with approval)
# Then backport to dev
```

---

**Remember**: The monorepo + path-based CI/CD means you can work independently on frontend or backend while sharing the same branches! 🎉
