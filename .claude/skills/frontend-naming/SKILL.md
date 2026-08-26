---
name: frontend-naming
description: Cross-cutting — naming rules for every file, folder, symbol, type, and constant in apps/frontend. Use before creating a file or exporting a symbol in any layer, and when reviewing a diff for convention drift.
---

# Frontend Naming

Full reference: `apps/frontend/instructions/naming-conventions.instructions.md`. This is the working set.

## Cheat sheet

| Thing | Convention | Example |
|---|---|---|
| Data-layer file | `<domain>-<role>.ts` kebab-case | `api-keys-api.ts`, `api-keys-service.ts` |
| Endpoint builders file | always exactly `api-constants.ts` | — |
| Handler file | `<area>.handlers.ts` | `header.handlers.ts`, `api-keys.handlers.ts` |
| Hook file | `use<Feature>.ts` | `useUserUrlValidation.ts`, `useApiKeysQuery.ts` |
| Component file | `PascalCase.tsx` | `NameEditDialog.tsx` |
| Context file (subtree) | `<domain>-context.tsx` | `profile-dropdown-options-context.tsx` |
| Context file (section) | `<Section>Context.tsx`, co-located | `ApiKeysSectionContext.tsx` |
| Types hub | always exactly `domain.ts` | — |
| Local schema file | `<entity>.schema.ts` | `api-key.schema.ts` |
| Test IDs | always exactly `testids.ts` | — |
| Layer folder | lowercase, no underscore | `api/`, `services/`, `handlers/`, `hooks/` |
| Section folder | kebab-case | `header/`, `activity-log/` |
| List-page zone folder | `(<zone>)/` | `(table)/`, `(filter)/`, `(header)/` |
| Next.js route group | `(<kebab-case>)/` | `(users-private)/`, `(user-hybrid)/` |
| Variable | `camelCase` | `transformedProfile` |
| Boolean | `is` / `has` / `can` / `should` prefix | `isUrlLocked`, `hasActiveApiKey` |
| Array | plural | `eligibleIds`, `selectedApiKeyIds` |
| Ref | `<name>Ref` | `requestVersionRef`, `timeoutRef` |
| Initial state constant | `INITIAL_<STATE_NAME>` | `INITIAL_URL_VALIDATION_STATE` |
| Handler export | `handle<Action><Entity>` | `handleUploadProfilePhoto` |
| Service function | verb-first camelCase | `syncTimezones`, `getAllApiKeys` |
| API function | verb-first camelCase, same as service | `getUsers`, `createApiKey` |
| Hook export | `use<Feature>` | `useApiKeyUrlValidation` |
| Utility function | verb-first camelCase | `buildNameUpdatePayload` |
| Module-level constant | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Endpoint object | `<DOMAIN>_<FEATURE>_ENDPOINTS` | `API_KEY_ENDPOINTS` |
| Query key constant | `<FEATURE>_QUERY_KEY` | `API_KEYS_QUERY_KEY` |
| Test ID object | `<ENTITY>_<ZONE>` | `KEY_TABLE`, `KEY_FILTER` |
| Test ID value | kebab-case string | `'key-header-add-button'` |
| Type / interface | `PascalCase` | `TransformedProfileData` |
| Form values type | `<Entity>FormValues` | `ApiKeyFormValues` |
| Status union | `<Entity>Status` | `ApiKeyStatus` |
| Hook options / state type | `<Feature>Options` / `<Feature>State` | `UrlValidationOptions`, `UrlValidationState` |
| Page component | `<Domain>Page.tsx`, `<Domain>PageServer.tsx` | `ApiKeysPage.tsx` |
| Presenter | `<Entity>Presenter.tsx` | `KeysPresenter.tsx` |
| Section component | `<Domain><Section>SectionComponent.tsx` | — |
| Service namespace import | `* as <domain>Service` | `* as apiKeysService` |
| RHF form instance | `form` | `const form = useForm(...)` |
| Watched RHF value | `watched<Field>` | `watchedExpiresAt` |

## Shared-contract names (from `@repo/schemas-types`)

Never renamed, never aliased at the import site:

| Artifact | Pattern |
|---|---|
| Zod schema VALUE | `<Domain><Feature>PayloadValidationSchema` |
| Inferred request TYPE | `<Domain><Feature>PayloadType` |
| Response interface | `<Domain><Feature>ResponseType` or `<Feature>ApiResponse` |
| List/paginated response | `<Domain><Feature>ListResponse` |

`import { X as Y }` from `@repo/schemas-types` is an anti-pattern — two names for one thing, and grep stops working.

## Import style

```typescript
// service in a handler — namespace alias, always
import * as apiKeyService from '../services/api-keys-service';

// feature code from app/ or another feature — @modules alias, never relative
import UserProfilePage from '@modules/user-management/profile/components/pages/UserProfilePage';

// within one feature folder — relative
import { API_KEY_TABLE } from '../../utils/testids';

// dynamic dialog
const NameEditDialog = dynamic(() => import('./NameEditDialog'));
```

## Two documented drifts — follow the code, not the heading

- `naming-conventions.instructions.md` §2 is headed "underscore prefix — always", but its own example block and all of `modules/` use `api/`, `services/`, `handlers/`. **No underscore.** The only prefixed folders were in the legacy `features/` tree, which has since been fully retired — nothing left to copy from or migrate.
- The same doc lists `module-directory.md`; the file is `module-directory.instructions.md`.

## Checklist

- [ ] File name matches its layer's pattern
- [ ] Fixed-name files are exact: `api-constants.ts`, `domain.ts`, `testids.ts`
- [ ] Folders: layer lowercase, sections kebab-case, zones in parentheses
- [ ] Booleans prefixed, arrays plural, refs suffixed
- [ ] Handlers `handle<Action><Entity>`, services/APIs verb-first, hooks `use<Feature>`
- [ ] Constants `SCREAMING_SNAKE_CASE`; endpoint and testid objects follow their patterns
- [ ] Shared contract names used verbatim, no alias
- [ ] `@modules` alias across features; relative only inside one feature
