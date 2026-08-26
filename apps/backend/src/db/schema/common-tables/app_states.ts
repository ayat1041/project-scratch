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

export const appStates = pgTable(
  "app_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
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
    // Ensure state name is unique within a country
    uniqueStatePerCountry: uniqueIndex("uq_state_name_country").on(
      table.name,
      table.countryId,
    ),
    // Index for fast lookup by country
    countryIdIdx: index("idx_states_country_id").on(table.countryId),
  }),
);

export default appStates;
