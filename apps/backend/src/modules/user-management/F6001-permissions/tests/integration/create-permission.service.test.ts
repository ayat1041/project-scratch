// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import { appPermissionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import { createPermissionService } from "../../services/permission.service";

const createdPermissionIds: number[] = [];
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

after(async () => {
  for (const id of createdPermissionIds) {
    await db.delete(appPermissionsTable).where(eq(appPermissionsTable.id, id));
  }
  await closeDbPool();
});

test("createPermissionService - creates a new permission", async () => {
  const name = `user-management.permission.${uid()}`;
  const created = await createPermissionService({
    name,
    description: "permission created by integration test",
  });

  assert.equal(created.length, 1);
  assert.equal(created[0]!.name, name);
  createdPermissionIds.push(created[0]!.id);

  const fromDb = await db
    .select()
    .from(appPermissionsTable)
    .where(eq(appPermissionsTable.id, created[0]!.id));

  assert.equal(fromDb.length, 1);
  assert.equal(fromDb[0]!.name, name);
});

test("createPermissionService - throws CONFLICT for duplicate name", async () => {
  const name = `user-management.permission.duplicate.${uid()}`;
  const first = await createPermissionService({
    name,
    description: "first insert",
  });
  createdPermissionIds.push(first[0]!.id);

  await assert.rejects(
    () =>
      createPermissionService({
        name,
        description: "duplicate insert",
      }),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.CONFLICT);
      return true;
    },
  );
});
