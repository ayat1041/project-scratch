/**
 * Feature registry — the single source of truth linking a feature ID to its module,
 * its folder on disk, and its Jira Epic.
 *
 * `slug` must match the on-disk folder name for modules that use the `F####-<slug>`
 * convention (auth). The drift guard at
 * `apps/backend/src/constants/feature-registry.test.ts` enforces this in both directions.
 *
 * See `docs/jira-conventions.md` for the Jira mapping.
 */

import type { ModuleKey } from "./modules";

export const APP_KEYS = [
  "backend",
  "frontend",
  "admin",
  "e2e",
  "db",
  "infra",
] as const;

export type AppKey = (typeof APP_KEYS)[number];

export type FeatureStatus = "shipped" | "in-progress" | "planned" | "retired";

export interface FeatureDefinition {
  /** `F` + 4 digits. Leading digit identifies the module band. */
  readonly id: string;
  readonly module: ModuleKey;
  /** Folder name after the `F####-` prefix, for modules using feature folders. */
  readonly slug: string;
  /** Jira Epic summary, minus the `F#### · ` prefix. */
  readonly label: string;
  /** Jira Epic key. `null` until the Epic exists. */
  readonly jiraEpic: string | null;
  /** Apps this feature spans. Drives the Jira labels on the Epic. */
  readonly apps: readonly AppKey[];
  readonly status: FeatureStatus;
}

export const FEATURES = {
  // ─── F1xxx · Authentication ────────────────────────────────────────────────
  // Grouped by user journey, matching the section comments already in auth.routes.ts.
  // Google/LinkedIn sit under F1002 rather than the file's "Others" heading: they are
  // named *-signin-controller, share oauth-callback.utils.ts, and produce a session.
  // Everything left over (auth.utils.ts, the two cross-feature services, types) is
  // shared infrastructure, not a feature — it stays unnumbered.
  F1001: {
    id: "F1001",
    module: "auth",
    slug: "signup",
    label: "Signup & Email Verification",
    jiraEpic: null,
    apps: ["backend", "frontend"],
    status: "shipped",
  },
  F1002: {
    id: "F1002",
    module: "auth",
    slug: "signin",
    label: "Sign In & Session",
    jiraEpic: null,
    apps: ["backend", "frontend"],
    status: "shipped",
  },
  F1003: {
    id: "F1003",
    module: "auth",
    slug: "password-reset",
    label: "Password Reset",
    jiraEpic: null,
    apps: ["backend", "frontend"],
    status: "shipped",
  },

  // ─── F5xxx · Common / reference data ──────────────────────────────────────
  F5001: {
    id: "F5001",
    module: "common",
    slug: "countries",
    label: "Countries",
    jiraEpic: null,
    apps: ["backend"],
    status: "shipped",
  },
  F5002: {
    id: "F5002",
    module: "common",
    slug: "states",
    label: "States",
    jiraEpic: null,
    apps: ["backend"],
    status: "shipped",
  },
  F5003: {
    id: "F5003",
    module: "common",
    slug: "cities",
    label: "Cities",
    jiraEpic: null,
    apps: ["backend"],
    status: "shipped",
  },
  F5004: {
    id: "F5004",
    module: "common",
    slug: "languages",
    label: "Languages",
    jiraEpic: null,
    apps: ["backend"],
    status: "shipped",
  },
  F5007: {
    id: "F5007",
    module: "common",
    slug: "search-location",
    label: "Location Search",
    jiraEpic: null,
    apps: ["backend"],
    status: "shipped",
  },
  // F5008 is built but its routes file is never mounted in routes.ts — the endpoints are
  // unreachable, so it is in-progress rather than shipped.
  F5008: {
    id: "F5008",
    module: "common",
    slug: "activity-logs",
    label: "Activity Logs",
    jiraEpic: null,
    apps: ["backend"],
    status: "in-progress",
  },

  // ─── F6xxx · User management ──────────────────────────────────────────────
  F6001: {
    id: "F6001",
    module: "user-management",
    slug: "permissions",
    label: "Permissions",
    jiraEpic: null,
    apps: ["backend", "admin"],
    status: "shipped",
  },
  F6002: {
    id: "F6002",
    module: "user-management",
    slug: "roles",
    label: "Roles",
    jiraEpic: null,
    apps: ["backend", "admin"],
    status: "shipped",
  },
  F6003: {
    id: "F6003",
    module: "user-management",
    slug: "users",
    label: "User Management",
    jiraEpic: null,
    apps: ["backend", "admin"],
    status: "in-progress",
  },

  // ─── F7xxx · Content / SEO ────────────────────────────────────────────────
  F7001: {
    id: "F7001",
    module: "content",
    slug: "site-seo-settings",
    label: "Site SEO Settings",
    jiraEpic: null,
    apps: ["backend", "admin", "frontend"],
    status: "in-progress",
  },
  F7002: {
    id: "F7002",
    module: "content",
    slug: "seo-pages",
    label: "SEO Page Overrides",
    jiraEpic: null,
    apps: ["backend", "admin", "frontend"],
    status: "planned",
  },

  // ─── F9xxx · Platform / infra ─────────────────────────────────────────────
  // No entry for deployment/infrastructure: it lives in infra/ansible and CI workflows,
  // with no folder under apps/backend and no endpoints, so it is not a code feature.
  // Those Epics are created directly in Jira.
  F9001: {
    id: "F9001",
    module: "platform",
    slug: "cron-jobs",
    label: "Cron Job Scheduling",
    jiraEpic: null,
    apps: ["backend"],
    status: "shipped",
  },
} as const satisfies Record<string, FeatureDefinition>;

export type FeatureId = keyof typeof FEATURES;
