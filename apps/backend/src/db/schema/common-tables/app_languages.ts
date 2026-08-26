import "module-alias/register";
import { pgTable, timestamp, varchar, uuid, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const appLanguages = pgTable(
  "app_languages",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Index for case-insensitive text search
    nameSearchIdx: index("idx_languages_name_search").on(
      sql`LOWER(${table.name})`,
    ),
  }),
);
export default appLanguages;
