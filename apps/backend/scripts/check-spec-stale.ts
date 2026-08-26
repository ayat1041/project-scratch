/**
 * Spec-staleness checker — the "did anyone forget to update the FRD?" guard.
 * See: apps/backend/docs/instructions/spec-sync.instructions.md
 *
 * This is the WARN-ONLY companion to check-spec-drift.ts. Where spec-drift asserts
 * structural invariants (endpoint↔swagger, enum↔doc, AC↔test) and hard-fails,
 * spec-staleness is a git-history heuristic: it counts how many commits have
 * touched a feature's source code since its FRD was last updated. A growing gap
 * signals the FRD is drifting from reality and should be reconciled.
 *
 * It is intentionally non-blocking (heuristic, not invariant): it runs warn-only
 * in the pre-commit hook and can be surfaced as a CI annotation, but never fails
 * a build. Reconciliation is human judgement; this just tells you when to look.
 *
 * Usage (from apps/backend):
 *   pnpm run check:spec-stale              # exit 0 always; prints warnings
 *   pnpm run check:spec-stale -- --strict  # exit 1 when any FRD is stale (opt-in)
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = process.cwd(); // apps/backend
const STRICT = process.argv.includes("--strict");

interface StalenessCheck {
  name: string;
  frd: string;
  sourcePaths: string[];
  excludePaths?: string[];
  thresholdCommits?: number;
}

interface Config {
  specStaleness?: StalenessCheck[];
}

const config: Config = JSON.parse(
  readFileSync(join(ROOT, "scripts/spec-drift.config.json"), "utf8"),
);

const DEFAULT_THRESHOLD = 5;
const warnings: string[] = [];

function git(args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

/** Build a git pathspec list: sourcePaths plus `:(exclude)` entries. */
function pathspec(check: StalenessCheck): string[] {
  const includes = check.sourcePaths.map((p) => resolve(ROOT, p));
  const excludes = (check.excludePaths ?? []).map(
    (p) => `:(exclude)${resolve(ROOT, p)}`,
  );
  return [...includes, ...excludes];
}

function checkStaleness(check: StalenessCheck): void {
  const frdAbs = resolve(ROOT, check.frd);
  const frdLast = git(["log", "-1", "--format=%H", "--", frdAbs]);
  if (!frdLast) {
    warnings.push(
      `[spec-stale] ${check.name}: FRD has no commit history (new/untracked?): ${check.frd}`,
    );
    return;
  }

  const spec = pathspec(check);
  const countRaw = git([
    "rev-list",
    "--count",
    `${frdLast}..HEAD`,
    "--",
    ...spec,
  ]);
  const behind = Number.parseInt(countRaw || "0", 10) || 0;
  const threshold = check.thresholdCommits ?? DEFAULT_THRESHOLD;

  if (behind > threshold) {
    const frdDate = git(["log", "-1", "--format=%ci", "--", frdAbs]);
    const lastSrc = git(["log", "-1", "--format=%h %ci", "--", ...spec]);
    warnings.push(
      `[spec-stale] ${check.name}\n` +
        `    FRD last updated: ${frdDate} (${frdLast.slice(0, 8)})\n` +
        `    ${behind} source commit(s) have landed since then (threshold ${threshold}).\n` +
        `    Most recent source change: ${lastSrc}\n` +
        `    FRD: ${check.frd}\n` +
        `    → Run Spec Sync and re-stamp the FRD per spec-sync.instructions.md.`,
    );
  }
}

const checks = config.specStaleness ?? [];
if (checks.length === 0) {
  console.log("ℹ️  spec-stale: no specStaleness mappings configured — nothing to check.");
  process.exit(0);
}

for (const check of checks) checkStaleness(check);

if (warnings.length === 0) {
  console.log(`✅ spec-stale: all ${checks.length} FRD(s) within freshness threshold.`);
  process.exit(0);
}

console.log(`\n⚠️  spec-stale WARNINGS (${warnings.length}):\n`);
for (const w of warnings) console.log("  " + w.replace(/\n/g, "\n  ") + "\n");
console.log(
  "These are heuristics, not failures — a stale FRD may be intentional. " +
    "Reconcile per apps/backend/docs/instructions/spec-sync.instructions.md.\n",
);
process.exit(STRICT ? 1 : 0);
