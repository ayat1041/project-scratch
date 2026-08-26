import { db } from "@/db/db";
import { appCountriesTable } from "@/db/schema";
import { and, asc, count, desc, ilike } from "drizzle-orm";
import { IncomingRequestValidationParams } from "@/utils/validation-function.utils";

export const getCountriesService = async ({
  limit,
  offset,
  search,
  fields,
  sortField,
  sortOrder,
  countTotal = false,
}: IncomingRequestValidationParams) => {
  // Default fields if not provided
  const selectedFields = fields?.length
    ? fields.reduce(
        (acc, field) => ({
          ...acc,
          [field]: (appCountriesTable as unknown as Record<string, unknown>)[
            field
          ],
        }),
        {},
      )
    : {
        id: appCountriesTable.id,
        name: appCountriesTable.name,
      };

  // Build where conditions
  const whereConditions = [];
  if (search) {
    whereConditions.push(ilike(appCountriesTable.name, `%${search}%`));
  }
  // Build base query with optional where
  const baseQuery = db.select(selectedFields).from(appCountriesTable);
  const filteredQuery =
    whereConditions.length > 0
      ? baseQuery.where(and(...whereConditions))
      : baseQuery;
  const sortColumn = sortField
    ? (appCountriesTable as unknown as Record<string, unknown>)[sortField]
    : appCountriesTable.name;
  const orderedQuery = filteredQuery.orderBy(
    sortOrder === "desc" ? desc(sortColumn as never) : asc(sortColumn as never),
  );
  const query = orderedQuery.limit(limit).offset(offset);

  const countries = await query;

  return {
    success: true,
    pagination: {
      limit: limit !== undefined ? limit : 10,
      offset: offset !== undefined ? offset : 0,
      currentCount: countries.length,
      total: countTotal
        ? await db
            .select({ count: count() })
            .from(appCountriesTable)
            .where(and(...whereConditions))
        : "not_counted",
    },
    data: countries,
  };
};
