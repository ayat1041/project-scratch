import { db } from "@/db/db";
import { appLanguagesTable } from "@/db/schema";
import { like, and, asc, count, desc } from "drizzle-orm";
import { IncomingRequestValidationParams } from "@/utils/validation-function.utils";

export const getLanguagesService = async ({
  limit,
  offset,
  fields,
  sortField,
  sortOrder,
  countTotal = false,
  search,
}: IncomingRequestValidationParams) => {
  // Default fields if not provided
  const selectedFields = fields?.length
    ? fields.reduce(
        (acc, field) => ({
          ...acc,
          [field]: (appLanguagesTable as unknown as Record<string, unknown>)[
            field
          ],
        }),
        {},
      )
    : {
        id: appLanguagesTable.id,
        name: appLanguagesTable.name,
      };

  // Build where conditions
  const whereConditions = [];
  if (search) {
    whereConditions.push(
      like(appLanguagesTable.name, `%${search.toLowerCase()}%`),
    );
  }

  // Build base query with optional where
  const baseQuery = db.select(selectedFields).from(appLanguagesTable);
  const filteredQuery =
    whereConditions.length > 0
      ? baseQuery.where(and(...whereConditions))
      : baseQuery;
  const sortColumn = sortField
    ? (appLanguagesTable as unknown as Record<string, unknown>)[sortField]
    : appLanguagesTable.name;
  const orderedQuery = filteredQuery.orderBy(
    sortOrder === "desc" ? desc(sortColumn as never) : asc(sortColumn as never),
  );
  const query = orderedQuery.limit(limit).offset(offset);

  const languages = await query;

  return {
    data: languages,
    success: true,
    pagination: {
      limit: limit !== undefined ? limit : 10,
      offset: offset !== undefined ? offset : 0,
      currentCount: languages.length,
      total: countTotal
        ? await db
            .select({ count: count() })
            .from(appLanguagesTable)
            .where(and(...whereConditions))
        : "not_counted",
    },
  };
};
