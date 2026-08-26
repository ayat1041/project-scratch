# Frontend Module Directory

Entry point for navigating the frontend app. Every completed module is listed here. When a new module is added, register it in the appropriate section.

---

## Module Status Legend

| Status | Description |
|---|---|
| ✅ | Implemented |
| 🔲 Stub | Route exists, `page.tsx` only, no real implementation yet |

Every module is a vertical slice with optional layers (`api/`, `services/`, `handlers/`, `hooks/`, `types/`, `validations/`, `constants/`, `utils/`, `components/`, `context/`). Any module can use any combination. Modules that share mutations delegate to the parent `<domain>/private/` stack instead of owning their own `api/` and `handlers/`.

---

## Directory Structure

All feature code lives in `modules/`. The `app/` directory contains only routing (layouts + `page.tsx`).

```
apps/frontend/
├── app/                                  ← Routing only
│   ├── (public)/
│   │   └── (auth)/
│   │       └── auth/
│   │           ├── (sign-in)/
│   │           └── (sign-up)/
│   └── (dashboard-shell)/
│       ├── dashboard/
│       ├── profile/page.tsx              🔲 Stub — "my own profile"
│       └── settings/page.tsx             🔲 Stub — account settings
└── modules/                              ← All feature implementations
    ├── auth/
    └── common/
```

Only `auth/` and `common/` are implemented today. Sections 3+ below sketch the module
a **new** `user-management` domain would use, anchored on the two real stub routes above
(`profile/`, `settings/`) — build those out first when this becomes a real feature.

---

## 1. Auth — `modules/auth/`

### Shared auth layers

```
modules/auth/
├── api/
│   ├── api-constants.ts
│   └── auth-api-service.ts
├── components/
│   ├── PasswordRequirementsChecklist.tsx
│   └── shared/
├── handlers/
│   ├── index.ts
│   ├── password.handlers.ts
│   ├── session.handlers.ts
│   ├── sign-in.handlers.ts
│   ├── sign-up.handlers.ts
│   └── verification.handlers.ts
├── hooks/
│   └── useUniquenessCheck.ts
├── services/
│   ├── index.ts
│   └── auth-service.ts
└── validations/
    └── schemas.ts
```

### Sign-In sub-features

| Sub-module | Feature path | Key file |
|---|---|---|
| Sign In | `modules/auth/signin/` | `components/SignInForm.tsx` |
| Forgot Password | `modules/auth/forgot-password/` | `components/ForgotPasswordForm.tsx` |
| Validate Reset Code | `modules/auth/validate-reset-code/` | `components/ValidateResetCodeForm.tsx` |
| Reset Password | `modules/auth/reset-password/` | `components/ResetPasswordForm.tsx` |
| OTP Change Password | `modules/auth/otp-change-password/` | `components/OtpChangePasswordForm.tsx` |
| Google Sign-In | `modules/auth/google-signin/` | `handlers/google-auth-client.handlers.ts` |
| LinkedIn Sign-In | `modules/auth/linkedin-signin/` | `handlers/linkedin-auth-client.handlers.ts` |
| Welcome | `modules/auth/welcome/` | Post-signup welcome |

### Sign-Up sub-features

| Sub-module | Feature path |
|---|---|
| Sign Up | `modules/auth/sign-up/` (`signup/`, `email-verification/`, `please-verify/`, `verify-email/`) |

---

## 2. Common — `modules/common/` ✅

Shared portal-shell components, constants, and types used across the dashboard.

```
modules/common/
├── components/
│   ├── DashboardSidebar.tsx
│   ├── DashboardSidebarSkeleton.tsx
│   ├── NotificationButton.tsx
│   ├── NotificationList.tsx
│   └── PortalHeader.tsx
├── constants/
│   └── notifications.ts
└── types/
    └── domain.ts
```

---

## 3. User Management (illustrative — not built yet) — `modules/user-management/`

Nothing under `user-management/` exists on disk yet — `app/(dashboard-shell)/profile/` and
`app/(dashboard-shell)/settings/` are currently 🔲 stub routes with no module behind them.
The three sub-sections below show the shape each of the three canonical patterns (4A
Hybrid, 4B Private CRUD, 4C Lightweight List-Page) would take if you built this module,
so you have a concrete reference to copy instead of starting from the bare pattern skill.

### 3a. User Profile — `modules/user-management/profile/`

**Pattern: Hybrid (4A)**
**Route:** `app/users/(user-hybrid)/[userId]/page.tsx` (owner vs. visitor split); the
existing `app/(dashboard-shell)/profile/page.tsx` stub is the always-owner shortcut for
"my own profile" and would route through the same module once built.

```
modules/user-management/profile/
├── api/
│   ├── api-constants.ts
│   └── profile-api.ts
├── components/
│   ├── pages/
│   │   ├── UserProfilePage.tsx           (owner-edit, Client Component)
│   │   └── UserProfilePageServer.tsx     (public-read, Server Component)
│   ├── shared/
│   │   ├── EditableEntryList.tsx
│   │   ├── MissingFieldsList.tsx
│   │   └── BaseDialog.tsx
│   └── sections/
│       ├── header/
│       │   ├── avatar/                   (AvatarEditDialog.tsx + CircleCropper.tsx)
│       │   ├── location-dialog/          (LocationEditDialog.tsx subsections)
│       │   └── name-dialog/              (NameEditDialog.tsx subsections)
│       ├── bio/
│       ├── contact-info/
│       ├── preferences/                  (timezone, language)
│       ├── account-status/               (email verification banner)
│       └── submit/
├── context/
│   └── user-profile-dropdown-options-context.tsx  (shared static dropdown-option
│                                                     reference data: countries,
│                                                     timezones, languages)
├── handlers/
│   ├── header.handlers.ts
│   ├── contact-info.handlers.ts
│   ├── content.handlers.ts
│   └── verification.handlers.ts
│   (no index.ts — imported individually by relative path)
├── hooks/
│   ├── index.ts
│   ├── useUsernameUrlValidation.ts        (checks the unique `userName` column)
│   ├── useContactCrudDialog.ts
│   ├── useEmailVerification.ts
│   ├── useImageUploadDialog.ts
│   ├── useLanguageInput.ts
│   ├── useNameDialog.ts
│   ├── useOverridableState.ts
│   ├── usePhotoUpload.ts
│   └── useTimezoneSection.ts
├── services/
│   ├── index.ts
│   └── user-profile-service.ts
├── types/
│   └── domain.ts
├── utils/
│   ├── helpers.ts
│   └── testids.ts
└── validations/
    └── schemas.ts
```

---

## 4. User Management Private Pages — `modules/user-management/`

### 4a. Shared Private Mutation Stack — `modules/user-management/private/`

Shared mutation handlers and client-side services consumed by both 4B/4C child modules
below.

```
modules/user-management/private/
├── api/
│   ├── api-constants.ts
│   └── (entity-specific api services)
├── handlers/
│   ├── api-keys.handlers.ts
│   ├── user-preferences.handlers.ts
│   └── index.ts
└── services/
    ├── api-keys-service.ts
    ├── user-preferences-service.ts
    └── session-service.ts
```

Child modules import from here via:
- `'../../../../private/handlers'` (from `(table)/` depth)
- `'../../../private/handlers'` (from `components/` depth)

---

### 4b. API Keys — `modules/user-management/api-keys/`

**Pattern: Private CRUD, live table**
**Route:** `app/(dashboard-shell)/settings/api-keys/page.tsx`

```
modules/user-management/api-keys/
├── api/
├── components/
│   ├── pages/ApiKeysPageClient.tsx
│   ├── tabs/KeysTab.tsx, SessionsTab.tsx
│   ├── actions/ApiKeyStatusActions.tsx
│   ├── modals/CreateApiKeyModal.tsx
│   └── ...
├── handlers/
│   ├── api-keys.handlers.ts
│   ├── sessions.handlers.ts
│   └── keys.handlers.ts
├── hooks/
├── services/
├── types/
├── utils/
└── validations/
    └── schemas.ts
```

**Note:** a module has no `validations/` folder when the backend owns every validation
rule. API keys sends the raw key name to the API and renders the 422 `details`
categories back — the frontend never pre-validates.

---

### 4c. User Preferences — `modules/user-management/user-preferences/`

**Pattern: Lightweight List-Page (4C)**
**Route:** `app/(dashboard-shell)/settings/preferences/page.tsx`

```
modules/user-management/user-preferences/
├── components/
│   ├── (filter)/index.tsx
│   ├── (header)/index.tsx
│   └── (table)/
│       ├── UserPreferenceTable.tsx
│       ├── UserPreferenceDialogs.tsx
│       ├── PreferenceValueInputCell.tsx
│       └── useUserPreferenceTable.ts
├── constants/
├── services/
├── types/
├── utils/
└── validations/
    └── user-preferences.schema.ts
```

---

### 4d. Stub Pages

| Page | Route | Status |
|---|---|---|
| Profile | `app/(dashboard-shell)/profile/` | 🔲 Stub |
| Settings | `app/(dashboard-shell)/settings/` | 🔲 Stub |

---

## 5. Next.js API Route Handlers — `app/api/`

```
app/api/
├── file-upload/route.ts    ← Server-side upload handler
└── image-proxy/route.ts    ← Proxies external image URLs
```

---

## Adding a New Module

1. Determine the pattern: **Hybrid (4A)**, **Private CRUD (4B)**, or **Lightweight List-Page (4C)**
2. Create `modules/<domain>/<feature-name>/` with the correct layer structure
3. For Pattern 4C: add handler + service files to `modules/<domain>/private/` first
4. Create the route entry point in `app/<domain>/...`
5. Follow the layer contract in `module-architecture-and-layers.instructions.md`
6. Register the module in this file with its pattern label and status
