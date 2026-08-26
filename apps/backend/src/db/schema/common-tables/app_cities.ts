import {
  pgTable,
  varchar,
  decimal,
  timestamp,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { appCountries } from "@/db/schema/common-tables/app_countries";
import { appStates } from "@/db/schema/common-tables/app_states";

export const appCities = pgTable(
  "app_cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => appStates.id, { onDelete: "cascade" }),
    countryId: uuid("country_id")
      .notNull()
      .references(() => appCountries.id, { onDelete: "cascade" }),
    latitude: decimal("latitude", { precision: 10, scale: 6 }),
    longitude: decimal("longitude", { precision: 10, scale: 6 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Ensure city name is unique within a state
    uniqueCityPerState: uniqueIndex("uq_city_name_state").on(
      table.name,
      table.stateId,
    ),
    // Indexes for performance
    stateIdIdx: index("idx_cities_state_id").on(table.stateId),
    countryIdIdx: index("idx_cities_country_id").on(table.countryId),
  }),
);

export default appCities;
