/**
 * Lookup helpers over the feature registry.
 *
 * All lookups accept a plain `string` so callers can resolve IDs parsed from folder
 * names, branch names, or commit scopes without casting.
 */

import { FEATURES, type FeatureDefinition } from "./features";
import { MODULES, type ModuleKey } from "./modules";

/**
 * IDs that were allocated and then withdrawn. They are never reassigned, and no Jira
 * Epic exists for them. Empty until a feature ID is retired.
 */
export const RETIRED_FEATURE_IDS: ReadonlySet<string> = new Set([]);

/** Every registry entry, in declaration order. */
export const ALL_FEATURES: readonly FeatureDefinition[] = Object.values(FEATURES);

const FEATURES_BY_ID: ReadonlyMap<string, FeatureDefinition> = new Map(
  ALL_FEATURES.map((feature) => [feature.id, feature]),
);

/** Resolve a feature by ID, e.g. `"F1001"`. */
export const getFeatureById = (featureId: string): FeatureDefinition | undefined =>
  FEATURES_BY_ID.get(featureId);

/** Every feature owned by a module, in ID order. */
export const getFeaturesByModule = (moduleKey: ModuleKey): FeatureDefinition[] =>
  ALL_FEATURES.filter((feature) => feature.module === moduleKey).sort((a, b) =>
    a.id.localeCompare(b.id),
  );

/** Resolve a feature from its Jira Epic key, e.g. `"ALGX-41"`. */
export const getFeatureByJiraEpic = (jiraEpicKey: string): FeatureDefinition | undefined =>
  ALL_FEATURES.find((feature) => feature.jiraEpic === jiraEpicKey);

/** `true` when the ID was allocated and withdrawn. */
export const isRetiredFeatureId = (featureId: string): boolean =>
  RETIRED_FEATURE_IDS.has(featureId);

/**
 * The Jira Epic summary for a feature: `"F1001 · Signup & Email Verification"`.
 * See `docs/jira-conventions.md` §3.
 */
export const toJiraEpicSummary = (feature: FeatureDefinition): string =>
  `${feature.id} · ${feature.label}`;

/**
 * The Jira labels for a feature's Epic: the feature ID plus one per app it spans.
 * See `docs/jira-conventions.md` §8.
 */
export const toJiraLabels = (feature: FeatureDefinition): string[] => [
  feature.id,
  ...feature.apps,
];

/** The Jira Component for a feature, derived from its module. */
export const toJiraComponent = (feature: FeatureDefinition): string =>
  MODULES[feature.module].jiraComponent;
