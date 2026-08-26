const fs = require("fs");

const c = JSON.parse(
  fs.readFileSync("docs/postman/all-modules.postman_collection.json", "utf8"),
);

const normalizePath = (parts) =>
  "/" +
  (parts || [])
    .map((p) => {
      if (typeof p !== "string") return String(p);
      if (p.startsWith(":")) return `{${p.slice(1)}}`;
      const m = p.match(/^\{\{(.+)\}\}$/);
      return m ? `{${m[1]}}` : p;
    })
    .join("/");

const bySig = new Map();
const byName = new Map();

const walk = (items, trail = []) => {
  for (const it of items || []) {
    const current = it.name ? [...trail, it.name] : trail;
    if (it.request) {
      const method = (it.request.method || "").toUpperCase();
      const path = normalizePath(it.request?.url?.path || []);
      const sig = `${method} ${path}`;
      const rec = {
        name: it.name || "(unnamed)",
        sig,
        trail: current.join(" > "),
      };

      if (!bySig.has(sig)) bySig.set(sig, []);
      bySig.get(sig).push(rec);

      const nameKey = it.name || "(unnamed)";
      if (!byName.has(nameKey)) byName.set(nameKey, []);
      byName.get(nameKey).push(rec);
    }

    if (Array.isArray(it.item)) walk(it.item, current);
  }
};

walk(c.item || []);

const dupSig = [...bySig.entries()]
  .filter(([, v]) => v.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

const dupName = [...byName.entries()]
  .filter(([, v]) => v.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

const totalRequests = [...bySig.values()].reduce((n, v) => n + v.length, 0);

console.log("TOTAL_REQUESTS", totalRequests);
console.log("UNIQUE_SIGNATURES", bySig.size);
console.log("DUPLICATE_SIGNATURE_GROUPS", dupSig.length);
for (const [sig, items] of dupSig.slice(0, 20)) {
  console.log("SIG", sig, "COUNT", items.length);
}

console.log("DUPLICATE_NAME_GROUPS", dupName.length);
for (const [name, items] of dupName.slice(0, 20)) {
  const sigs = [...new Set(items.map((i) => i.sig))];
  console.log("NAME", name, "COUNT", items.length, "UNIQUE_SIGS", sigs.length);
}
