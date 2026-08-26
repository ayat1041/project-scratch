// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import { appPermissionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listAllPermissionsService } from "../../services/permission.service";

let seededPermissionIds: number[] = [];
let searchToken = "";
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

before(async () => {
  searchToken = `search-${uid()}`;

  const created = await db
    .insert(appPermissionsTable)
    .values([
      {
        name: `user-management.permission.list.${searchToken}.a`,
        description: "list test seed a",
      },
      {
        name: `user-management.permission.list.${searchToken}.b`,
        description: "list test seed b",
      },
      {
        name: `user-management.permission.list.${searchToken}.c`,
        description: "list test seed c",
      },
    ])
    .returning({ id: appPermissionsTable.id });

  seededPermissionIds = created.map((row) => row.id);
});

after(async () => {
  for (const id of seededPermissionIds) {
    await db.delete(appPermissionsTable).where(eq(appPermissionsTable.id, id));
  }
  await closeDbPool();
});

test("listAllPermissionsService - returns paginated permission list", async () => {
  const result = await listAllPermissionsService({
    limit: 2,
    offset: 0,
    sort: "desc",
  });

  assert.ok(Array.isArray(result.permissions));
  assert.ok(result.permissions.length <= 2);
  assert.ok(result.total >= seededPermissionIds.length);
});

test("listAllPermissionsService - applies search filter", async () => {
  const result = await listAllPermissionsService({
    limit: 10,
    offset: 0,
    sort: "desc",
    search: searchToken,
  });

  assert.ok(result.permissions.length >= 1);
  for (const row of result.permissions) {
    assert.ok(String(row.name).includes(searchToken));
  }
});
