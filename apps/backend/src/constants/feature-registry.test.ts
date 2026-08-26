/**
 * Drift guard for the feature registry.
 *
 * Pure filesystem + registry comparison — no DB, no Redis, no network.
 *
 * The registry in `@repo/constants` and the `F####-<slug>` folders on disk must agree
 * in BOTH directions. The absence of exactly this check is what allowed `F2007` (a
 * duplicate of `F2001` with no folder) and the `F2006` collision (one ID claimed by two
 * features) to sit unnoticed in the old `src/constants/features-list/`.
 *
 * See `docs/jira-conventions.md` §7.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  ALL_FEATURES,
  FEATURES,
  MODULES,
  MODULE_KEYS,
  RETIRED_FEATURE_IDS,
  bandOfFeatureId,
  type FeatureDefinition,
  type ModuleKey,
} from "@repo/constants";

/** `apps/backend` — this file lives at `apps/backend/src/constants/`. */
const BACKEND_ROOT = path.resolve(__dirname, "../..");

const FEATURE_FOLDER_PATTERN = /^F(\d{4})-(.+)$/;

interface FeatureFolder {
  readonly id: string;
  readonly slug: string;
  readonly relativePath: string;
}

/**
 * Collect `F####-<slug>` directories under `root`, recursing so nested features are
 * found too — a feature folder may itself contain another feature folder nested inside it.
 */
const collectFeatureFolders = (root: string): FeatureFolder[] => {
  const found: FeatureFolder[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const absolute = path.join(dir, entry.name);
      const match = FEATURE_FOLDER_PATTERN.exec(entry.name);

      if (match) {
        found.push({
          id: `F${match[1]}`,
          slug: match[2]!,
          relativePath: path.relative(BACKEND_ROOT, absolute),
        });
      }

      walk(absolute);
    }
  };

  walk(root);
  return found;
};

const modulesWithFeatureFolders = MODULE_KEYS.filter(
  (key) => MODULES[key].featureFolderRoot !== null,
);

const foldersByModule = new Map<ModuleKey, FeatureFolder[]>(
  modulesWithFeatureFolders.map((key) => {
    const root = path.join(BACKEND_ROOT, MODULES[key].featureFolderRoot!);
    assert.ok(
      existsSync(root),
      `MODULES.${key}.featureFolderRoot points at a missing directory: ${root}`,
    );
    return [key, collectFeatureFolders(root)];
  }),
);

test("every feature ID is unique and matches its registry key", () => {
  for (const [key, feature] of Object.entries(FEATURES)) {
    assert.equal(
      (feature as FeatureDefinition).id,
      key,
      `FEATURES.${key} has id "${(feature as FeatureDefinition).id}" — key and id must match`,
    );
  }

  const ids = ALL_FEATURES.map((feature) => feature.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate feature IDs in FEATURES");
});

test("every feature ID falls inside its module's band", () => {
  for (const feature of ALL_FEATURES) {
    const band = bandOfFeatureId(feature.id);
    assert.notEqual(band, null, `${feature.id} is not a well-formed F#### id`);
    assert.equal(
      band,
      MODULES[feature.module].band,
      `${feature.id} is registered to module "${feature.module}" (band ${MODULES[feature.module].band}) but its ID sits in band ${band}`,
    );
  }
});

test("retired IDs are absent from the registry and from disk", () => {
  for (const retiredId of RETIRED_FEATURE_IDS) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(FEATURES, retiredId),
      false,
      `${retiredId} is retired but still present in FEATURES`,
    );

    for (const folders of foldersByModule.values()) {
      const clash = folders.find((folder) => folder.id === retiredId);
      assert.equal(
        clash,
        undefined,
        `${retiredId} is retired but a folder still uses it: ${clash?.relativePath}`,
      );
    }
  }
});

test("every feature folder on disk has a matching registry entry", () => {
  for (const [moduleKey, folders] of foldersByModule) {
    for (const folder of folders) {
      const feature = (FEATURES as Record<string, FeatureDefinition | undefined>)[folder.id];

      assert.ok(
        feature,
        `folder ${folder.relativePath} has no FEATURES entry — add ${folder.id} to packages/constants/src/modules/features/features.ts`,
      );
      assert.equal(
        feature.slug,
        folder.slug,
        `${folder.id}: registry slug "${feature.slug}" does not match folder "${folder.slug}" (${folder.relativePath})`,
      );
      assert.equal(
        feature.module,
        moduleKey,
        `${folder.id}: registry says module "${feature.module}" but the folder lives under "${moduleKey}"`,
      );
    }
  }
});

test("every registry entry for a feature-folder module exists on disk", () => {
  for (const [moduleKey, folders] of foldersByModule) {
    const idsOnDisk = new Set(folders.map((folder) => folder.id));

    for (const feature of ALL_FEATURES) {
      if (feature.module !== moduleKey) continue;
      if (feature.status === "planned" || feature.status === "retired") continue;

      assert.ok(
        idsOnDisk.has(feature.id),
        `${feature.id} ("${feature.slug}") is registered as ${feature.status} under "${moduleKey}" but has no F####- folder under ${MODULES[moduleKey].featureFolderRoot}`,
      );
    }
  }
});

test("no two feature folders claim the same ID", () => {
  const seen = new Map<string, string>();

  for (const folders of foldersByModule.values()) {
    for (const folder of folders) {
      const previous = seen.get(folder.id);
      assert.equal(
        previous,
        undefined,
        `${folder.id} is claimed by two folders: ${previous} and ${folder.relativePath}`,
      );
      seen.set(folder.id, folder.relativePath);
    }
  }
});
