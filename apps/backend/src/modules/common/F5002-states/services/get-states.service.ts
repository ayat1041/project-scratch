import { db } from "@/db/db";
import { appStatesTable } from "@/db/schema";
import { eq, and, asc, desc, count, ilike } from "drizzle-orm";
import { IncomingRequestValidationParams } from "@/utils/validation-function.utils";

// extend IncomingRequestValidationParams with categoryId
interface StatesRequestValidationParams extends IncomingRequestValidationParams {
  countryId?: string;
}

// GET - Fetch all states with optional filtering and pagination
export const getStatesService = async ({
  offset,
  limit,
  search,
  countryId,
  fields,
  sortField,
  sortOrder,
  countTotal = false,
}: StatesRequestValidationParams) => {
  // Default fields if not provided
  const selectedFields = fields?.length
    ? fields.reduce(
        (acc, field) => ({
          ...acc,
          [field]: (appStatesTable as unknown as Record<string, unknown>)[field],
        }),
        {},
      )
    : {
        id: appStatesTable.id,
        name: appStatesTable.name,
      };

  // Build where conditions
  const whereConditions = [];
  if (search) {
    whereConditions.push(ilike(appStatesTable.name, `%${search}%`));
  }
  if (countryId) {
    whereConditions.push(eq(appStatesTable.countryId, countryId));
  }

  // Build base query with optional where
  const baseQuery = db.select(selectedFields).from(appStatesTable);
  const filteredQuery =
    whereConditions.length > 0
      ? baseQuery.where(and(...whereConditions))
      : baseQuery;
  const sortColumn = sortField
    ? (appStatesTable as unknown as Record<string, unknown>)[sortField]
    : appStatesTable.name;
  const orderedQuery = filteredQuery.orderBy(
    sortOrder === "desc" ? desc(sortColumn as never) : asc(sortColumn as never),
  );
  const query = orderedQuery.limit(limit).offset(offset);

  const states = await query;

  return {
    success: true,
    pagination: {
      limit: limit !== undefined ? limit : 10,
      offset: offset !== undefined ? offset : 0,
      currentCount: states.length,
      total: countTotal
        ? await db
            .select({ count: count(appStatesTable.id) })
            .from(appStatesTable)
            .where(and(...whereConditions))
        : "not_counted",
    },
    data: states,
  };
};
