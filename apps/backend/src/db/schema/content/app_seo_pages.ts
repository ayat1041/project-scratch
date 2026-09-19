import "module-alias/register";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const appSeoPages = pgTable("app_seo_pages", {
  id: uuid().primaryKey().defaultRandom(),
  path: varchar("path", { length: 500 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export default appSeoPages;
