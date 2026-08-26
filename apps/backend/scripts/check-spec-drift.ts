/**
 * Spec-drift checker — the self-enforcing half of the Spec Sync loop.
 * See: apps/backend/docs/instructions/spec-sync.instructions.md
 *
 * Three checks:
 *   A. endpoint-without-swagger — every endpoint defined in a *.routes.ts file
 *      must have a documented OpenAPI operation (in swagger-docs/*.swagger.ts or
 *      controllers/*.ts) attributed to its owning routes directory.
 *   B. enum-vs-doc — every value of a configured status enum must appear in its
 *      mapped spec doc(s), so a new state added in code (e.g. `queued`) can't be
 *      silently missing from the FRD/runtime doc.
 *   C. ac-traceability — every backend-scoped acceptance criterion (AC-N) defined
 *      in an FRD's acceptance-criteria table must be referenced by at least one
 *      test file, and every AC-N referenced in tests must exist in the FRD. Turns
 *      the FR→AC→test chain from a rot-prone comment convention into an invariant.
 *
 * Usage (from apps/backend):
 *   pnpm run check:spec-drift            # exits non-zero on drift (CI / pre-merge)
 *   pnpm run check:spec-drift -- --warn-only   # never fails the process
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";

const ROOT = process.cwd(); // apps/backend
const WARN_ONLY = process.argv.includes("--warn-only");

interface Config {
  endpointSwagger: { modulesRoot: string; ignoreRouteDirs: string[] };
  enumChecks: Array<{
    name: string;
    enumFile: string;
    enumName: string;
    docs: string[];
    ignoreValues?: string[];
  }>;
  acTraceability?: Array<{
    name: string;
    frd: string;
    testsRoot: string;
    outOfScopeMarkers?: string[];
    ignoreAcIds?: string[];
  }>;
}

const config: Config = JSON.parse(
  readFileSync(join(ROOT, "scripts/spec-drift.config.json"), "utf8"),
);

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;
const problems: string[] = [];

// ── file walking ──────────────────────────────────────────────────────────────
function walk(dir: string, match: (p: string) => boolean): string[] {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "dist") continue;
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) out.push(...walk(full, match));
    else if (match(full)) out.push(full);
  }
  return out;
}

// ── counting helpers ───────────────────────────────────────────────────────────
/** Endpoint definitions in a routes file: router.get(/post(/put(/patch(/delete( — excludes router.use(. */
function countEndpointDefs(text: string): number {
  const re = /\brouter\.(get|post|put|patch|delete)\s*\(/g;
  return (text.match(re) ?? []).length;
}

/** Documented OpenAPI operations in a swagger/controller source: bare method keys inside @swagger/@openapi JSDoc. */
function countDocumentedOps(text: string): number {
  if (!/@swagger|@openapi/.test(text)) return 0;
  const re = new RegExp(`^\\s*\\*\\s*(${HTTP_METHODS.join("|")}):\\s*$`, "gm");
  return (text.match(re) ?? []).length;
}

/** Nearest ancestor routes directory for a given file, among known routes dirs. */
function nearestRouteDir(filePath: string, routeDirs: string[]): string | null {
  let best: string | null = null;
  for (const rd of routeDirs) {
    if (filePath.startsWith(rd + "/") && (best === null || rd.length > best.length)) {
      best = rd;
    }
  }
  return best;
}

/**
 * Outermost routes directory that contains `dir` (or `dir` itself), among known
 * routes dirs. Sub-feature routers mounted via `router.use(...)` (e.g. a nested
 * feature's `.routes.ts` mounted under its parent feature's `.routes.ts`) are
 * rolled up to their top-level ancestor so endpoint/doc counts aren't split
 * across a parent/child pair that really form one documentation unit.
 */
function rootRouteDir(dir: string, routeDirs: string[]): string {
  let root = dir;
  for (const rd of routeDirs) {
    if (
      (dir === rd || dir.startsWith(rd + "/")) &&
      rd.length < root.length
    ) {
      root = rd;
    }
  }
  return root;
}

// ── CHECK A: endpoint-without-swagger ───────────────────────────────────────────
function checkEndpointSwagger(): void {
  const modulesRoot = join(ROOT, config.endpointSwagger.modulesRoot);
  const ignore = new Set(
    config.endpointSwagger.ignoreRouteDirs.map((d) => resolve(ROOT, d)),
  );

  const routeFiles = walk(modulesRoot, (p) => p.endsWith(".routes.ts"));
  // A routes dir "owns" its subtree until a deeper routes dir takes over.
  const routeDirs = [...new Set(routeFiles.map((f) => dirname(f)))]
    .filter((d) => !ignore.has(d))
    .sort();

  // endpoint counts per owning routes dir, rolled up to the top-level routes dir
  // for nested sub-feature routers (e.g. mounted via `router.use(...)`).
  const endpointCount = new Map<string, number>();
  for (const f of routeFiles) {
    const d = dirname(f);
    if (ignore.has(d)) continue;
    const root = rootRouteDir(d, routeDirs);
    endpointCount.set(root, (endpointCount.get(root) ?? 0) + countEndpointDefs(readFileSync(f, "utf8")));
  }

  // documented-op counts attributed to nearest owning routes dir, then rolled up
  // the same way so docs filed under a nested feature's swagger-docs/ still
  // count toward endpoints defined in an ancestor's routes file.
  const swaggerSources = walk(
    modulesRoot,
    (p) => p.endsWith(".swagger.ts") || /\/controllers\/[^/]+\.ts$/.test(p),
  );
  const docOpCount = new Map<string, number>();
  for (const f of swaggerSources) {
    const ops = countDocumentedOps(readFileSync(f, "utf8"));
    if (ops === 0) continue;
    const owner = nearestRouteDir(f, routeDirs);
    if (owner) {
      const root = rootRouteDir(owner, routeDirs);
      docOpCount.set(root, (docOpCount.get(root) ?? 0) + ops);
    }
  }

  for (const [dir, defined] of [...endpointCount.entries()].sort()) {
    if (defined === 0) continue; // pure sub-mount router (router.use only)
    const documented = docOpCount.get(dir) ?? 0;
    const rel = relative(ROOT, dir);
    if (documented < defined) {
      problems.push(
        `[endpoint-without-swagger] ${rel}\n` +
          `    ${defined} endpoint(s) defined, ${documented} OpenAPI operation(s) documented` +
          ` → ${defined - documented} undocumented.`,
      );
    }
  }
}

// ── CHECK B: enum-vs-doc ─────────────────────────────────────────────────────────
function extractEnumValues(fileText: string, enumName: string): string[] {
  // Match: export const NAME = { ... };  (first closing brace)
  const start = fileText.indexOf(enumName);
  if (start === -1) return [];
  const braceOpen = fileText.indexOf("{", start);
  const braceClose = fileText.indexOf("}", braceOpen);
  if (braceOpen === -1 || braceClose === -1) return [];
  const body = fileText.slice(braceOpen, braceClose);
  const values = [...body.matchAll(/:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  return [...new Set(values)];
}

function checkEnumVsDoc(): void {
  for (const check of config.enumChecks) {
    const enumPath = resolve(ROOT, check.enumFile);
    let enumText = "";
    try {
      enumText = readFileSync(enumPath, "utf8");
    } catch {
      problems.push(`[enum-vs-doc] ${check.name}: enum file not found: ${check.enumFile}`);
      continue;
    }
    const values = extractEnumValues(enumText, check.enumName);
    if (values.length === 0) {
      problems.push(`[enum-vs-doc] ${check.name}: no values extracted for ${check.enumName}`);
      continue;
    }
    const ignore = new Set(check.ignoreValues ?? []);
    const docTexts = check.docs.map((d) => {
      try {
        return readFileSync(resolve(ROOT, d), "utf8").toLowerCase();
      } catch {
        problems.push(`[enum-vs-doc] ${check.name}: doc not found: ${d}`);
        return "";
      }
    });

    const missing = values
      .filter((v) => !ignore.has(v))
      .filter((v) => !docTexts.some((t) => t.includes(v.toLowerCase())));

    if (missing.length > 0) {
      problems.push(
        `[enum-vs-doc] ${check.name}\n` +
          `    enum ${check.enumName} value(s) absent from mapped doc(s): ${missing.join(", ")}\n` +
          `    docs: ${check.docs.join(", ")}`,
      );
    }
  }
}

// ── CHECK C: ac-traceability (FRD ↔ tests) ──────────────────────────────────────
const AC_ID_RE = /AC-\d+(?:\.\d+)?/g;

/** Numeric-aware sort so AC-2 precedes AC-10 in output. */
function sortAcIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const [a0, a1 = 0] = a.replace("AC-", "").split(".").map(Number);
    const [b0, b1 = 0] = b.replace("AC-", "").split(".").map(Number);
    return a0 - b0 || a1 - b1;
  });
}

/**
 * AC IDs defined in the FRD's acceptance-criteria table, partitioned by scope.
 * A table row is "out of scope" when its coverage column contains a configured
 * marker (e.g. "not in backend scope"), so UI-only ACs aren't required to have
 * backend tests. Only table rows (`| AC-N | ... |`) count as definitions — this
 * deliberately ignores inline "Verified by: AC-N" mentions in FR lines.
 */
function parseFrdAcIds(
  frdText: string,
  outOfScopeMarkers: string[],
): { inScope: Set<string>; outOfScope: Set<string> } {
  const inScope = new Set<string>();
  const outOfScope = new Set<string>();
  for (const line of frdText.split("\n")) {
    const m = line.match(/^\s*\|\s*(?:[A-Za-z0-9]+-)?(AC-\d+(?:\.\d+)?)\s*\|(.*)$/);
    if (!m) continue;
    const id = m[1];
    const rest = m[2].toLowerCase();
    const isOutOfScope = outOfScopeMarkers.some((mark) =>
      rest.includes(mark.toLowerCase()),
    );
    (isOutOfScope ? outOfScope : inScope).add(id);
  }
  return { inScope, outOfScope };
}

function checkAcTraceability(): void {
  for (const check of config.acTraceability ?? []) {
    let frdText = "";
    try {
      frdText = readFileSync(resolve(ROOT, check.frd), "utf8");
    } catch {
      problems.push(`[ac-traceability] ${check.name}: FRD not found: ${check.frd}`);
      continue;
    }

    const { inScope, outOfScope } = parseFrdAcIds(
      frdText,
      check.outOfScopeMarkers ?? [],
    );
    if (inScope.size === 0 && outOfScope.size === 0) {
      problems.push(
        `[ac-traceability] ${check.name}: no AC IDs found in FRD table: ${check.frd}`,
      );
      continue;
    }

    // AC IDs referenced anywhere in the test tree.
    const testFiles = walk(resolve(ROOT, check.testsRoot), (p) => p.endsWith(".test.ts"));
    const referenced = new Set<string>();
    for (const f of testFiles) {
      for (const id of readFileSync(f, "utf8").match(AC_ID_RE) ?? []) {
        referenced.add(id);
      }
    }

    const ignore = new Set(check.ignoreAcIds ?? []);

    // missing: in-scope ACs (not grandfathered) with no referencing test.
    const missing = sortAcIds(
      [...inScope].filter((id) => !ignore.has(id) && !referenced.has(id)),
    );
    if (missing.length > 0) {
      problems.push(
        `[ac-without-test] ${check.name}\n` +
          `    backend-scoped AC(s) in FRD with no referencing test: ${missing.join(", ")}\n` +
          `    tests root: ${check.testsRoot}`,
      );
    }

    // orphan: referenced in tests but not defined in the FRD table at all.
    const known = new Set([...inScope, ...outOfScope]);
    const orphans = sortAcIds([...referenced].filter((id) => !known.has(id)));
    if (orphans.length > 0) {
      problems.push(
        `[orphan-ac] ${check.name}\n` +
          `    AC(s) referenced in tests but absent from the FRD table: ${orphans.join(", ")}\n` +
          `    FRD: ${check.frd}`,
      );
    }
  }
}

// ── run ──────────────────────────────────────────────────────────────────────────
checkEndpointSwagger();
checkEnumVsDoc();
checkAcTraceability();

if (problems.length === 0) {
  console.log(
    "✅ spec-drift: no drift detected (endpoint↔swagger, enum↔doc, AC↔test).",
  );
  process.exit(0);
}

const header = WARN_ONLY ? "⚠️  spec-drift WARNINGS" : "❌ spec-drift FAILURES";
console.log(`\n${header} (${problems.length}):\n`);
for (const p of problems) console.log("  " + p.replace(/\n/g, "\n  ") + "\n");
console.log(
  "Reconcile per apps/backend/docs/instructions/spec-sync.instructions.md " +
    "(author missing swagger docs, or add the new state to the mapped doc).\n",
);
process.exit(WARN_ONLY ? 0 : 1);
