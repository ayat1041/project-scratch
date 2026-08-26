import { db } from "@/db/db";
import { appCitiesTable } from "@/db/schema";
import { eq, and, asc, desc, count, ilike } from "drizzle-orm";
import { IncomingRequestValidationParams } from "@/utils/validation-function.utils";

// extend IncomingRequestValidationParams with categoryId
interface CitiesRequestValidationParams extends IncomingRequestValidationParams {
  stateId?: string;
}

// GET - Fetch all states with optional filtering and pagination
export const getCitiesService = async ({
  offset,
  limit,
  search,
  stateId,
  fields,
  sortField,
  sortOrder,
  countTotal = false,
}: CitiesRequestValidationParams) => {
  // Default fields if not provided
  const selectedFields = fields?.length
    ? fields.reduce(
        (acc, field) => ({
          ...acc,
          [field]: (appCitiesTable as unknown as Record<string, unknown>)[field],
        }),
        {},
      )
    : {
        id: appCitiesTable.id,
        name: appCitiesTable.name,
      };

  // Build where conditions
  const whereConditions = [];
  if (search) {
    whereConditions.push(ilike(appCitiesTable.name, `%${search}%`));
  }
  if (stateId) {
    whereConditions.push(eq(appCitiesTable.stateId, stateId));
  }

  // Build base query with optional where
  const baseQuery = db.select(selectedFields).from(appCitiesTable);
  const filteredQuery =
    whereConditions.length > 0
      ? baseQuery.where(and(...whereConditions))
      : baseQuery;
  const sortColumn = sortField
    ? (appCitiesTable as unknown as Record<string, unknown>)[sortField]
    : appCitiesTable.name;
  const orderedQuery = filteredQuery.orderBy(
    sortOrder === "desc" ? desc(sortColumn as never) : asc(sortColumn as never),
  );
  const query = orderedQuery.limit(limit).offset(offset);

  const cities = await query;

  return {
    success: true,
    pagination: {
      limit: limit !== undefined ? limit : 10,
      offset: offset !== undefined ? offset : 0,
      currentCount: cities.length,
      total: countTotal
        ? await db
            .select({ count: count(appCitiesTable.id) })
            .from(appCitiesTable)
            .where(and(...whereConditions))
        : "not_counted",
    },
    data: cities,
  };
};
