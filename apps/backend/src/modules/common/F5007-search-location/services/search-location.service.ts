import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/db/db";
import { appCitiesTable, appStatesTable } from "@/db/schema";
import { createError } from "@/middleware/error.middleware";
import type {
  SearchCitiesValidationType,
  SearchStatesValidationType,
} from "../validations/search-location.validation";

export interface SearchLocationStatesDataType {
  count: number;
  states: {
    stateId: string;
    stateName: string;
    countryId: string;
  }[];
}

export interface SearchLocationCitiesDataType {
  count: number;
  cities: {
    cityId: string;
    cityName: string;
    stateId: string;
    countryId: string;
  }[];
}

type SearchStatesParams = Pick<
  SearchStatesValidationType,
  "countryId" | "limit"
> & {
  searchQuery?: string;
  isVerified?: boolean;
};

type SearchCitiesParams = Pick<
  SearchCitiesValidationType,
  "countryId" | "stateId" | "limit"
> & {
  searchQuery?: string;
  isVerified?: boolean;
};

export const searchStatesService = async ({
  countryId,
  searchQuery = "",
  limit = 10,
  isVerified = true,
}: SearchStatesParams): Promise<SearchLocationStatesDataType> => {
  try {
    void isVerified;
    const conditions = [eq(appStatesTable.countryId, countryId)];

    if (searchQuery.trim()) {
      conditions.push(ilike(appStatesTable.name, `%${searchQuery.trim()}%`));
    }

    const states = await db
      .select({
        stateId: appStatesTable.id,
        stateName: appStatesTable.name,
        countryId: appStatesTable.countryId,
      })
      .from(appStatesTable)
      .where(and(...conditions))
      .orderBy(asc(appStatesTable.name))
      .limit(limit);

    return {
      count: states.length,
      states,
    };
  } catch (error: unknown) {
    throw createError.database("Failed to search states", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
  }
};

export const searchCitiesService = async ({
  countryId,
  stateId,
  searchQuery = "",
  limit = 10,
  isVerified = true,
}: SearchCitiesParams): Promise<SearchLocationCitiesDataType> => {
  try {
    void isVerified;
    const conditions = [eq(appCitiesTable.countryId, countryId)];

    if (stateId) {
      conditions.push(eq(appCitiesTable.stateId, stateId));
    }

    if (searchQuery.trim()) {
      conditions.push(ilike(appCitiesTable.name, `%${searchQuery.trim()}%`));
    }

    const cities = await db
      .select({
        cityId: appCitiesTable.id,
        cityName: appCitiesTable.name,
        stateId: appCitiesTable.stateId,
        countryId: appCitiesTable.countryId,
      })
      .from(appCitiesTable)
      .where(and(...conditions))
      .orderBy(asc(appCitiesTable.name))
      .limit(limit);

    return {
      count: cities.length,
      cities,
    };
  } catch (error: unknown) {
    throw createError.database("Failed to search cities", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
  }
};
