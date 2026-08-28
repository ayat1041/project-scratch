import { db } from "@/db/db";
import { appSiteSeoSettingsVersionsTable } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

type SiteSeoSettingsVersionRow = typeof appSiteSeoSettingsVersionsTable.$inferSelect;
type SiteSeoSettingsVersionInsert = typeof appSiteSeoSettingsVersionsTable.$inferInsert;

export const findPublishedVersion = async (): Promise<
  SiteSeoSettingsVersionRow | undefined
> => {
  const rows = await db
    .select()
    .from(appSiteSeoSettingsVersionsTable)
    .where(eq(appSiteSeoSettingsVersionsTable.status, "published"))
    .limit(1);
  return rows[0];
};

export const findLatestDraftVersion = async (): Promise<
  SiteSeoSettingsVersionRow | undefined
> => {
  const rows = await db
    .select()
    .from(appSiteSeoSettingsVersionsTable)
    .where(eq(appSiteSeoSettingsVersionsTable.status, "draft"))
    .orderBy(desc(appSiteSeoSettingsVersionsTable.versionNumber))
    .limit(1);
  return rows[0];
};

export const findVersionById = async (
  id: string,
): Promise<SiteSeoSettingsVersionRow | undefined> => {
  const rows = await db
    .select()
    .from(appSiteSeoSettingsVersionsTable)
    .where(eq(appSiteSeoSettingsVersionsTable.id, id))
    .limit(1);
  return rows[0];
};

export const listVersions = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<{ rows: SiteSeoSettingsVersionRow[]; total: number }> => {
  const rows = await db
    .select()
    .from(appSiteSeoSettingsVersionsTable)
    .orderBy(desc(appSiteSeoSettingsVersionsTable.versionNumber))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appSiteSeoSettingsVersionsTable);

  return { rows, total: totalRow?.count ?? 0 };
};

const getNextVersionNumber = async (): Promise<number> => {
  const [row] = await db
    .select({
      max: sql<number>`coalesce(max(${appSiteSeoSettingsVersionsTable.versionNumber}), 0)`,
    })
    .from(appSiteSeoSettingsVersionsTable);
  return (row?.max ?? 0) + 1;
};

export const insertDraftVersion = async (
  values: Omit<
    SiteSeoSettingsVersionInsert,
    "id" | "versionNumber" | "status" | "publishedBy" | "publishedAt" | "createdAt" | "updatedAt"
  >,
  userId: string,
): Promise<SiteSeoSettingsVersionRow> => {
  const versionNumber = await getNextVersionNumber();
  const [row] = await db
    .insert(appSiteSeoSettingsVersionsTable)
    .values({
      ...values,
      versionNumber,
      status: "draft",
      createdBy: userId,
    })
    .returning();
  return row!;
};

export const updateDraftVersion = async (
  id: string,
  values: Omit<
    SiteSeoSettingsVersionInsert,
    "id" | "versionNumber" | "status" | "publishedBy" | "publishedAt" | "createdAt" | "updatedAt" | "createdBy"
  >,
): Promise<SiteSeoSettingsVersionRow> => {
  const [row] = await db
    .update(appSiteSeoSettingsVersionsTable)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(appSiteSeoSettingsVersionsTable.id, id))
    .returning();
  return row!;
};

export const publishDraftVersion = async (
  draftId: string,
  userId: string,
): Promise<SiteSeoSettingsVersionRow> => {
  return db.transaction(async (tx) => {
    await tx
      .update(appSiteSeoSettingsVersionsTable)
      .set({ status: "archived" })
      .where(eq(appSiteSeoSettingsVersionsTable.status, "published"));

    const [row] = await tx
      .update(appSiteSeoSettingsVersionsTable)
      .set({
        status: "published",
        publishedBy: userId,
        publishedAt: new Date(),
      })
      .where(eq(appSiteSeoSettingsVersionsTable.id, draftId))
      .returning();

    return row!;
  });
};
