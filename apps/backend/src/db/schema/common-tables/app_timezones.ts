import "module-alias/register";
import { pgTable, timestamp, varchar, uuid, index } from "drizzle-orm/pg-core";

const appTimezones = pgTable(
    "app_timezones",
    {
        id: uuid().primaryKey().defaultRandom(),
        // UTC offset label, e.g. "UTC+5:30"
        name: varchar("name", { length: 100 }).notNull().unique(),
        // Raw offset, e.g. "+5:30"
        utcOffset: varchar("utc_offset", { length: 10 }).notNull(),
        // Display label shown in UI, e.g. "UTC+5:30"
        label: varchar("label", { length: 150 }).notNull(),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => ({
        nameIdx: index("idx_timezones_name").on(table.name),
    }),
);

export default appTimezones;
