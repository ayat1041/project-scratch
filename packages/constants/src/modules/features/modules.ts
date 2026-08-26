/**
 * Module registry.
 *
 * Every backend module owns exactly one numeric band. A feature's ID band is what
 * identifies its module — `F1xxx` is auth because auth owns `F1xxx`.
 *
 * See `docs/jira-conventions.md` §5 for the band table and the Jira Component mapping.
 */

export const MODULE_KEYS = [
  "auth",
  "common",
  "user-management",
  "platform",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export interface ModuleDefinition {
  /** Stable key, also used as the Jira Component name. */
  readonly key: ModuleKey;
  /** Band base. Feature IDs for this module fall in `[band, band + 999]`. */
  readonly band: number;
  /** Human-readable module name. */
  readonly label: string;
  /** Jira Component this module maps to. */
  readonly jiraComponent: string;
  /**
   * Path (relative to `apps/backend`) where this module keeps `F####-<slug>` feature
   * folders, or `null` when the module does not use the feature-folder convention.
   *
   * Only modules with a non-null root are checked folder-against-registry by the
   * drift guard — the others exist on disk under plain domain names.
   */
  readonly featureFolderRoot: string | null;
}

export const MODULES: Record<ModuleKey, ModuleDefinition> = {
  auth: {
    key: "auth",
    band: 1000,
    label: "Authentication",
    jiraComponent: "auth",
    featureFolderRoot: "src/modules/auth/features",
  },
  common: {
    key: "common",
    band: 5000,
    label: "Common / reference data",
    jiraComponent: "common",
    featureFolderRoot: "src/modules/common",
  },
  "user-management": {
    key: "user-management",
    band: 6000,
    label: "User management",
    jiraComponent: "user-management",
    featureFolderRoot: "src/modules/user-management",
  },
  platform: {
    key: "platform",
    band: 9000,
    label: "Platform / infra",
    jiraComponent: "platform",
    featureFolderRoot: "src/modules/platform",
  },
};

/**
 * Bands not yet claimed by a module. Allocate the next open band when a new module
 * ships — see `docs/jira-conventions.md` §5.
 */
export const RESERVED_BANDS: readonly number[] = [];

/** Numeric band for a feature ID, e.g. `F1001` -> `1000`. */
export const bandOfFeatureId = (featureId: string): number | null => {
  const match = /^F(\d{4})$/.exec(featureId);
  if (!match) return null;
  return Math.floor(Number(match[1]) / 1000) * 1000;
};

/** Module that owns a feature ID's band, or `undefined` if the band is unallocated. */
export const moduleOfFeatureId = (featureId: string): ModuleDefinition | undefined => {
  const band = bandOfFeatureId(featureId);
  if (band === null) return undefined;
  return Object.values(MODULES).find((module) => module.band === band);
};
