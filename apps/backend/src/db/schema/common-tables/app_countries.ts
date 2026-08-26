import {
  pgTable,
  varchar,
  decimal,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const appCountries = pgTable("app_countries", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  iso3: varchar("iso3", { length: 3 }).notNull().unique(),
  iso2: varchar("iso2", { length: 2 }).notNull().unique(),
  phoneCode: varchar("phone_code", { length: 20 }),
  capital: varchar("capital", { length: 100 }),
  currency: varchar("currency", { length: 50 }),
  region: varchar("region", { length: 100 }),
  subregion: varchar("subregion", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  emoji: varchar("emoji", { length: 10 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export default appCountries;
