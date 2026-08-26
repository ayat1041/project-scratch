# Recommended User Management Schema

## Option 1: Single Users Table with Type (RECOMMENDED)

### Benefits:

- ✅ Single source of truth
- ✅ Simple queries
- ✅ Easy to add more user types
- ✅ No duplicate code
- ✅ Standard pattern used by Rails, Laravel, etc.

### Implementation:

```typescript
// app_users.ts
import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// Define user type enum
export const userTypeEnum = pgEnum("user_type", ["customer", "admin"]);

const appUsersTable = pgTable(
  "app_users",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 64 }).notNull(),
    userType: userTypeEnum("user_type").notNull().default("customer"),
    isVerified: boolean().notNull().default(false),
    isDeleted: boolean().notNull().default(false),
    registeredAt: timestamp("registered_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    providerName: varchar("provider_name", { length: 90 })
      .notNull()
      .default("email"),
    userName: varchar("username", { length: 150 }).notNull().unique(),
    profileImage: varchar("profile_image", { length: 500 }),
  },
  (table) => ({
    // Index for filtering by type
    userTypeIdx: index("idx_users_user_type").on(table.userType),
    // Composite index for common queries
    typeEmailIdx: index("idx_users_type_email").on(table.userType, table.email),
  }),
);

export default appUsersTable;
```

```typescript
// app_user_roles.ts
import {
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import appUsersTable from "@/db/schema/user-management/app_users";
import appRolesTable from "@/db/schema/user-management/app_roles";

const appUserRolesTable = pgTable(
  "app_user_roles",
  {
    userId: uuid("user_id")
      .references(() => appUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    roleId: integer("role_id")
      .references(() => appRolesTable.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
    userIdIdx: index("idx_user_roles_user_id").on(table.userId),
    roleIdIdx: index("idx_user_roles_role_id").on(table.roleId),
  }),
);

export default appUserRolesTable;
```

```typescript
// app_roles.ts - Enhanced with type scoping
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleTypeEnum = pgEnum("role_type", ["customer", "admin", "both"]);

const appRolesTable = pgTable("app_roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 91 }).notNull().unique(),
  description: text(),
  roleType: roleTypeEnum("role_type").notNull().default("both"), // Which user type this role applies to
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export default appRolesTable;
```

### Usage Examples:

```typescript
// Get all admin users
const admins = await db
  .select()
  .from(appUsersTable)
  .where(eq(appUsersTable.userType, "admin"));

// Get customer users with role
const customersWithRoles = await db
  .select()
  .from(appUsersTable)
  .leftJoin(appUserRolesTable, eq(appUsersTable.id, appUserRolesTable.userId))
  .leftJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
  .where(eq(appUsersTable.userType, "customer"));

// Check if admin user has specific role
const hasAdminRole = await db
  .select()
  .from(appUsersTable)
  .innerJoin(appUserRolesTable, eq(appUsersTable.id, appUserRolesTable.userId))
  .innerJoin(appRolesTable, eq(appUserRolesTable.roleId, appRolesTable.id))
  .where(
    and(
      eq(appUsersTable.id, userId),
      eq(appUsersTable.userType, "admin"),
      eq(appRolesTable.name, "super_admin"),
    ),
  );
```

---

## Option 2: Polymorphic Association (If Separation Required)

### Benefits:

- ✅ Physical table separation (better for data isolation)
- ✅ Can have different schemas if needed
- ✅ Clearer data governance

### Drawbacks:

- ❌ More complex queries
- ❌ Requires application-level logic
- ❌ Can't use foreign keys across types

### Implementation:

```typescript
// app_users.ts (keep as is for customers)
const appUsersTable = pgTable("app_users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 64 }).notNull(),
  isVerified: boolean().notNull().default(false),
  isDeleted: boolean().notNull().default(false),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  providerName: varchar("provider_name", { length: 90 })
    .notNull()
    .default("email"),
  userName: varchar("username", { length: 150 }).notNull().unique(),
  profileImage: varchar("profile_image", { length: 500 }),
});

// app_admin_users.ts (keep as is for admins)
const appAdminUsersTable = pgTable("app_admin_users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 64 }).notNull(),
  isVerified: boolean().notNull().default(false),
  isDeleted: boolean().notNull().default(false),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  providerName: varchar("provider_name", { length: 90 })
    .notNull()
    .default("email"),
  userName: varchar("username", { length: 150 }).notNull().unique(),
  profileImage: varchar("profile_image", { length: 500 }),
});

// app_user_roles.ts - FIXED VERSION
import { pgEnum } from "drizzle-orm/pg-core";

export const userableTypeEnum = pgEnum("userable_type", ["customer", "admin"]);

const appUserRolesTable = pgTable(
  "app_user_roles",
  {
    userableId: uuid("userable_id").notNull(), // Polymorphic ID
    userableType: userableTypeEnum("userable_type").notNull(), // 'customer' or 'admin'
    roleId: integer("role_id")
      .references(() => appRolesTable.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userableId, table.userableType, table.roleId],
    }),
    userableIdx: index("idx_user_roles_userable").on(
      table.userableId,
      table.userableType,
    ),
    roleIdIdx: index("idx_user_roles_role_id").on(table.roleId),
  }),
);

export default appUserRolesTable;
```

### Usage:

```typescript
// Assign role to customer
await db.insert(appUserRolesTable).values({
  userableId: customerId,
  userableType: "customer",
  roleId: 1,
});

// Assign role to admin
await db.insert(appUserRolesTable).values({
  userableId: adminId,
  userableType: "admin",
  roleId: 2,
});

// Get customer with roles
const customerWithRoles = await db
  .select()
  .from(appUsersTable)
  .leftJoin(
    appUserRolesTable,
    and(
      eq(appUsersTable.id, appUserRolesTable.userableId),
      eq(appUserRolesTable.userableType, "customer"),
    ),
  )
  .where(eq(appUsersTable.id, customerId));

// Get admin with roles
const adminWithRoles = await db
  .select()
  .from(appAdminUsersTable)
  .leftJoin(
    appUserRolesTable,
    and(
      eq(appAdminUsersTable.id, appUserRolesTable.userableId),
      eq(appUserRolesTable.userableType, "admin"),
    ),
  )
  .where(eq(appAdminUsersTable.id, adminId));
```

---

## Option 3: Shared Base + Type Tables

### Best for: Complex scenarios with different attributes per type

```typescript
// app_users.ts - Base table with common fields
const appUsersTable = pgTable("app_users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 64 }).notNull(),
  userType: userTypeEnum("user_type").notNull(),
  isVerified: boolean().notNull().default(false),
  isDeleted: boolean().notNull().default(false),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// app_customer_profiles.ts - Customer-specific data
const appCustomerProfilesTable = pgTable("app_customer_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => appUsersTable.id, { onDelete: "cascade" }),
  userName: varchar("username", { length: 150 }).notNull().unique(),
  profileImage: varchar("profile_image", { length: 500 }),
  loyaltyPoints: integer("loyalty_points").default(0),
  // Customer-specific fields
});

// app_admin_profiles.ts - Admin-specific data
const appAdminProfilesTable = pgTable("app_admin_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => appUsersTable.id, { onDelete: "cascade" }),
  userName: varchar("username", { length: 150 }).notNull().unique(),
  profileImage: varchar("profile_image", { length: 500 }),
  department: varchar({ length: 100 }),
  // Admin-specific fields
});

// app_user_roles.ts - Simple, references base users
const appUserRolesTable = pgTable(
  "app_user_roles",
  {
    userId: uuid("user_id")
      .references(() => appUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    roleId: integer("role_id")
      .references(() => appRolesTable.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  }),
);
```

---

## Comparison Table

| Feature               | Option 1 (Single Table) | Option 2 (Polymorphic) | Option 3 (Base + Type) |
| --------------------- | ----------------------- | ---------------------- | ---------------------- |
| **Simplicity**        | ⭐⭐⭐⭐⭐              | ⭐⭐⭐                 | ⭐⭐⭐                 |
| **Performance**       | ⭐⭐⭐⭐⭐              | ⭐⭐⭐⭐               | ⭐⭐⭐⭐               |
| **Data Isolation**    | ⭐⭐                    | ⭐⭐⭐⭐⭐             | ⭐⭐⭐⭐               |
| **Maintainability**   | ⭐⭐⭐⭐⭐              | ⭐⭐⭐                 | ⭐⭐⭐⭐               |
| **Flexibility**       | ⭐⭐⭐                  | ⭐⭐⭐⭐               | ⭐⭐⭐⭐⭐             |
| **Foreign Keys**      | ✅ Native               | ❌ Manual              | ✅ Native              |
| **Query Complexity**  | Simple                  | Medium                 | Medium                 |
| **Different Schemas** | ❌                      | ✅                     | ✅                     |

---

## Migration Strategy

### From Current to Option 1:

```sql
-- 1. Add user_type to app_users
ALTER TABLE app_users ADD COLUMN user_type VARCHAR(20) NOT NULL DEFAULT 'customer';
CREATE TYPE user_type AS ENUM ('customer', 'admin');
ALTER TABLE app_users ALTER COLUMN user_type TYPE user_type USING user_type::user_type;

-- 2. Migrate admin users to app_users
INSERT INTO app_users (id, email, password, user_type, is_verified, is_deleted, registered_at, created_at, updated_at, provider_name, username, profile_image)
SELECT id, email, password, 'admin', is_verified, is_deleted, registered_at, created_at, updated_at, provider_name, username, profile_image
FROM app_admin_users;

-- 3. Update user_roles table
ALTER TABLE app_user_roles ADD COLUMN new_user_id UUID;

-- Migrate customer user roles
UPDATE app_user_roles SET new_user_id = user_id WHERE user_id IS NOT NULL;

-- Migrate admin user roles
UPDATE app_user_roles SET new_user_id = admin_user_id WHERE admin_user_id IS NOT NULL AND user_id IS NULL;

-- 4. Drop old columns and rename
ALTER TABLE app_user_roles DROP COLUMN user_id;
ALTER TABLE app_user_roles DROP COLUMN admin_user_id;
ALTER TABLE app_user_roles RENAME COLUMN new_user_id TO user_id;
ALTER TABLE app_user_roles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE app_user_roles ADD FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- 5. Recreate primary key
ALTER TABLE app_user_roles DROP CONSTRAINT app_user_roles_pkey;
ALTER TABLE app_user_roles ADD PRIMARY KEY (user_id, role_id);

-- 6. Drop old admin_users table
DROP TABLE app_admin_users;

-- 7. Create indexes
CREATE INDEX idx_users_user_type ON app_users(user_type);
CREATE INDEX idx_users_type_email ON app_users(user_type, email);
```

---

## Recommendation

**Use Option 1 (Single Users Table)** unless you have:

- Strict data isolation requirements (different databases/schemas)
- Significantly different attributes per user type
- Regulatory requirements for physical separation

**Reasons:**

1. Industry standard pattern
2. Simpler queries and code
3. Better performance (single table scans)
4. Easier to maintain and extend
5. Native foreign key support
6. Your current schemas are identical anyway

If you absolutely need separation, use **Option 2 (Polymorphic)** but fix the current implementation as shown.
