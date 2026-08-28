import { db } from "@/db/db";
import { appSeoPagesTable, appSeoPagesVersionsTable } from "@/db/schema";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";

type SeoPageRow = typeof appSeoPagesTable.$inferSelect;
type SeoPageVersionRow = typeof appSeoPagesVersionsTable.$inferSelect;
type SeoPageVersionInsert = typeof appSeoPagesVersionsTable.$inferInsert;

export const findPageByPath = async (path: string): Promise<SeoPageRow | undefined> => {
  const rows = await db.select().from(appSeoPagesTable).where(eq(appSeoPagesTable.path, path)).limit(1);
  return rows[0];
};

export const findPageById = async (id: string): Promise<SeoPageRow | undefined> => {
  const rows = await db.select().from(appSeoPagesTable).where(eq(appSeoPagesTable.id, id)).limit(1);
  return rows[0];
};

export const insertPage = async (path: string): Promise<SeoPageRow> => {
  const [row] = await db.insert(appSeoPagesTable).values({ path }).returning();
  return row!;
};

export const deletePage = async (id: string): Promise<void> => {
  await db.delete(appSeoPagesTable).where(eq(appSeoPagesTable.id, id));
};

export const listPages = async ({
  limit,
  offset,
  search,
}: {
  limit: number;
  offset: number;
  search?: string;
}): Promise<{ pages: SeoPageRow[]; versions: SeoPageVersionRow[]; total: number }> => {
  const whereCondition = search ? ilike(appSeoPagesTable.path, `%${search}%`) : undefined;

  const pagesQuery = db.select().from(appSeoPagesTable).orderBy(desc(appSeoPagesTable.updatedAt)).limit(limit).offset(offset);
  const pages = await (whereCondition ? pagesQuery.where(whereCondition) : pagesQuery);

  const totalQuery = db.select({ count: sql<number>`count(*)::int` }).from(appSeoPagesTable);
  const [totalRow] = await (whereCondition ? totalQuery.where(whereCondition) : totalQuery);

  const pageIds = pages.map((page) => page.id);
  const versions = pageIds.length
    ? await db
        .select()
        .from(appSeoPagesVersionsTable)
        .where(inArray(appSeoPagesVersionsTable.pageId, pageIds))
        .orderBy(desc(appSeoPagesVersionsTable.versionNumber))
    : [];

  return { pages, versions, total: totalRow?.count ?? 0 };
};

export const findVersionsForPage = async (pageId: string): Promise<SeoPageVersionRow[]> => {
  return db
    .select()
    .from(appSeoPagesVersionsTable)
    .where(eq(appSeoPagesVersionsTable.pageId, pageId))
    .orderBy(desc(appSeoPagesVersionsTable.versionNumber));
};

export const findLatestDraftForPage = async (pageId: string): Promise<SeoPageVersionRow | undefined> => {
  const rows = await db
    .select()
    .from(appSeoPagesVersionsTable)
    .where(and(eq(appSeoPagesVersionsTable.pageId, pageId), eq(appSeoPagesVersionsTable.status, "draft")))
    .orderBy(desc(appSeoPagesVersionsTable.versionNumber))
    .limit(1);
  return rows[0];
};

export const findPublishedForPage = async (pageId: string): Promise<SeoPageVersionRow | undefined> => {
  const rows = await db
    .select()
    .from(appSeoPagesVersionsTable)
    .where(and(eq(appSeoPagesVersionsTable.pageId, pageId), eq(appSeoPagesVersionsTable.status, "published")))
    .limit(1);
  return rows[0];
};

export const findPublishedByPath = async (path: string): Promise<SeoPageVersionRow | undefined> => {
  const rows = await db
    .select({ version: appSeoPagesVersionsTable })
    .from(appSeoPagesVersionsTable)
    .innerJoin(appSeoPagesTable, eq(appSeoPagesVersionsTable.pageId, appSeoPagesTable.id))
    .where(and(eq(appSeoPagesTable.path, path), eq(appSeoPagesVersionsTable.status, "published")))
    .limit(1);
  return rows[0]?.version;
};

export const findVersionById = async (id: string): Promise<SeoPageVersionRow | undefined> => {
  const rows = await db.select().from(appSeoPagesVersionsTable).where(eq(appSeoPagesVersionsTable.id, id)).limit(1);
  return rows[0];
};

const getNextVersionNumber = async (pageId: string): Promise<number> => {
  const [row] = await db
    .select({
      max: sql<number>`coalesce(max(${appSeoPagesVersionsTable.versionNumber}), 0)`,
    })
    .from(appSeoPagesVersionsTable)
    .where(eq(appSeoPagesVersionsTable.pageId, pageId));
  return (row?.max ?? 0) + 1;
};

export const insertDraftVersionForPage = async (
  pageId: string,
  values: Omit<
    SeoPageVersionInsert,
    "id" | "pageId" | "versionNumber" | "status" | "publishedBy" | "publishedAt" | "createdAt" | "updatedAt"
  >,
  userId: string,
): Promise<SeoPageVersionRow> => {
  const versionNumber = await getNextVersionNumber(pageId);
  const [row] = await db
    .insert(appSeoPagesVersionsTable)
    .values({ ...values, pageId, versionNumber, status: "draft", createdBy: userId })
    .returning();
  return row!;
};

export const updateDraftVersion = async (
  id: string,
  values: Omit<
    SeoPageVersionInsert,
    "id" | "pageId" | "versionNumber" | "status" | "publishedBy" | "publishedAt" | "createdAt" | "updatedAt" | "createdBy"
  >,
): Promise<SeoPageVersionRow> => {
  const [row] = await db
    .update(appSeoPagesVersionsTable)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(appSeoPagesVersionsTable.id, id))
    .returning();
  return row!;
};

export const publishDraftVersionForPage = async (
  pageId: string,
  draftId: string,
  userId: string,
): Promise<SeoPageVersionRow> => {
  return db.transaction(async (tx) => {
    await tx
      .update(appSeoPagesVersionsTable)
      .set({ status: "archived" })
      .where(and(eq(appSeoPagesVersionsTable.pageId, pageId), eq(appSeoPagesVersionsTable.status, "published")));

    const [row] = await tx
      .update(appSeoPagesVersionsTable)
      .set({ status: "published", publishedBy: userId, publishedAt: new Date() })
      .where(eq(appSeoPagesVersionsTable.id, draftId))
      .returning();

    return row!;
  });
};
