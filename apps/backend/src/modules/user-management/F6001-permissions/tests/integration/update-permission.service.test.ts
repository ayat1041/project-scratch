// Requires: DATABASE_URL pointing to a running PostgreSQL instance (docker compose up)
import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { db, closeDbPool } from "@/db/db";
import { appPermissionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ERROR_TYPES, type ApiError } from "@/middleware/error.middleware";
import { updateSinglePermissionService } from "../../services/permission.service";

let targetPermissionId: number;
let otherPermissionId: number;
let targetName = "";
let otherName = "";
let seed = 0;
const uid = () => `${Date.now()}-${++seed}`;

before(async () => {
  targetName = `user-management.permission.update.target.${uid()}`;
  otherName = `user-management.permission.update.other.${uid()}`;

  const [target] = await db
    .insert(appPermissionsTable)
    .values({
      name: targetName,
      description: "target permission",
    })
    .returning({ id: appPermissionsTable.id });

  const [other] = await db
    .insert(appPermissionsTable)
    .values({
      name: otherName,
      description: "other permission",
    })
    .returning({ id: appPermissionsTable.id });

  targetPermissionId = target!.id;
  otherPermissionId = other!.id;
});

after(async () => {
  await db
    .delete(appPermissionsTable)
    .where(eq(appPermissionsTable.id, targetPermissionId));
  await db
    .delete(appPermissionsTable)
    .where(eq(appPermissionsTable.id, otherPermissionId));
  await closeDbPool();
});

test("updateSinglePermissionService - updates permission when name belongs to target permission", async () => {
  const result = await updateSinglePermissionService(
    String(targetPermissionId),
    {
      name: targetName,
      description: "updated description",
    },
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, targetPermissionId);
  assert.equal(result[0]!.description, "updated description");
});

test("updateSinglePermissionService - throws NOT_FOUND when provided name does not exist", async () => {
  await assert.rejects(
    () =>
      updateSinglePermissionService(String(targetPermissionId), {
        name: `missing-name-${uid()}`,
        description: "irrelevant",
      }),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.NOT_FOUND);
      return true;
    },
  );
});

test("updateSinglePermissionService - throws CONFLICT when name belongs to a different permission", async () => {
  await assert.rejects(
    () =>
      updateSinglePermissionService(String(targetPermissionId), {
        name: otherName,
        description: "conflict update",
      }),
    (err: ApiError) => {
      assert.equal(err.type, ERROR_TYPES.CONFLICT);
      return true;
    },
  );
});
