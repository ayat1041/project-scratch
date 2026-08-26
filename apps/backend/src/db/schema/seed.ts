/* eslint-disable @typescript-eslint/no-explicit-any */
import "module-alias/register";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./index";
import { userData, languageData } from "@/db/schema/seeders/seedData";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { appUsersTable } from "@/db/schema/index";
import { PERMISSIONS, ROLES, ADMIN_PERMISSIONS, USER_PERMISSIONS } from "@repo/constants";
import { UTC_OFFSETS } from "@repo/schemas-types/constants/timezones";

// Type definitions for seed data (Kaggle dataset structure)
interface CountryData {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  phone_code: string; // Kaggle uses phone_code with underscore
  capital: string;
  currency: string;
  currency_symbol?: string;
  region: string;
  subregion: string;
  latitude: string;
  longitude: string;
  emoji: string;
  native?: string;
  timezones?: any[];
  tld?: string;
  translations?: any;
  states?: StateData[];
}

interface StateData {
  id: number;
  name: string;
  state_code?: string; // Kaggle has state_code instead of iso2
  latitude: string | null;
  longitude: string | null;
  cities?: CityData[];
}

interface CityData {
  id: number;
  name: string;
  latitude: string | null;
  longitude: string | null;
}

const connectionString = process.env.DATABASE_URL!;
export const db = drizzle(connectionString, { schema, logger: true });

function normalizeSeedKey(value: string) {
  return value.trim().toLowerCase();
}

function uniqueByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeSeedKey(keyFn(item));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(items: string[]): string[] {
  return uniqueByKey(items, (item) => item);
}

// Helper to flatten nested permissions object to a string array
function flattenPermissions(obj: Record<string, any>): string[] {
  let result: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      result.push(value);
    } else if (typeof value === "object" && value !== null) {
      result = result.concat(flattenPermissions(value));
    }
  }
  return result;
}

const allPermissionStrings = uniqueStrings(flattenPermissions(PERMISSIONS));

async function seedPermissions() {
  console.log("Seeding permissions from permissions.ts...");
  for (const permission of allPermissionStrings) {
    await db
      .insert(schema.appPermissionsTable)
      .values({ name: permission })
      .onConflictDoNothing();
  }
  console.log("Permissions seeded from permissions.ts.");
}

async function seedRoles() {
  console.log("Seeding roles from roles.ts...");
  const allRoles = uniqueStrings(Object.values(ROLES));
  for (const role of allRoles) {
    await db
      .insert(schema.appRolesTable)
      .values({ name: role })
      .onConflictDoNothing();
  }
  console.log("Roles seeded from roles.ts.");
}

async function seedPermissionToRoles() {
  console.log(
    "Seeding permission to roles mapping from permission-to-roles.ts...",
  );

  // Get all permissions and roles from the database
  const permissions = await db.select().from(schema.appPermissionsTable);
  const roles = await db.select().from(schema.appRolesTable);

  // Create maps for easy lookup
  const permissionMap = Object.fromEntries(
    permissions.map((p) => [p.name, p.id]),
  );
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  // Helper to insert permissions for a role
  async function assignPermissionsToRole(
    roleName: string,
    permissionList: string[],
  ) {
    const roleId = roleMap[roleName];
    if (!roleId) return;
    for (const perm of uniqueStrings(permissionList)) {
      const permissionId = permissionMap[perm];
      if (permissionId) {
        await db
          .insert(schema.appPermissionToRolesTable)
          .values({
            permissionId,
            roleId,
          })
          .onConflictDoNothing();
      }
    }
  }

  // Map role names to permission arrays. SUPER_ADMIN gets every known
  // permission; ADMIN gets the curated admin set; USER gets the self-service set.
  await assignPermissionsToRole(ROLES.SUPER_ADMIN, allPermissionStrings);
  await assignPermissionsToRole(ROLES.ADMIN, ADMIN_PERMISSIONS);
  await assignPermissionsToRole(ROLES.USER, USER_PERMISSIONS);

  console.log(
    "Permission to roles mapping seeded from permission-to-roles.ts.",
  );
}

async function seedUsers() {
  console.log("Seeding users...");

  const uniqueUsers = uniqueByKey(userData, (user) => user.email);

  for (const user of uniqueUsers) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(user.password, 10);

    let finalUserName = user.userName.toLowerCase().replace(/\s+/g, "-");
    let counter = 1;

    // Check if canonical username already exists and make it unique
    while (true) {
      const existingUser = await db
        .select({ userName: appUsersTable.userName })
        .from(appUsersTable)
        .where(eq(appUsersTable.userName, finalUserName))
        .limit(1);

      if (existingUser.length === 0) {
        break; // Canonical username is available
      }

      // Canonical username exists, try with counter
      finalUserName = `${user.userName}-${counter}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 9999) {
        throw new Error("Unable to generate unique username");
      }
    }

    // Insert user
    const [createdUser] = await db
      .insert(schema.appUsersTable)
      .values({
        userName: finalUserName,
        email: user.email,
        password: hashedPassword,
        providerName: user.providerName,
        isVerified: user.isVerified,
        registeredAt: user.registeredAt,
      })
      .onConflictDoNothing()
      .returning();
    const effectiveUser =
      createdUser ||
      (
        await db
          .select({ id: schema.appUsersTable.id })
          .from(schema.appUsersTable)
          .where(eq(schema.appUsersTable.email, user.email))
          .limit(1)
      )[0];

    if (!effectiveUser) {
      console.warn(
        `Skipping user '${user.userName}' - unable to resolve user record.`,
      );
      continue;
    }

    // If user was created, assign roles
    if (user.roles) {
      for (const roleName of user.roles) {
        const [role] = await db
          .select({
            id: schema.appRolesTable.id,
          })
          .from(schema.appRolesTable)
          .where(eq(schema.appRolesTable.name, roleName))
          .limit(1);

        if (!role) {
          throw new Error(`Role not found: ${roleName}`);
        }

        await db
          .insert(schema.appUserRolesTable)
          .values({
            userId: effectiveUser.id,
            roleId: role.id,
          })
          .onConflictDoNothing();
      }

      console.log(
        `User '${user.userName}' created with roles: ${user.roles.join(", ")}`,
      );
    }
  }

  console.log("Users seeded.");
}

async function cleanDatabase() {
  try {
    console.log("🚀 Starting database cleanup...");

    // Get all table names from PostgreSQL information schema
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    const tableNames = result.rows.map((row) => row.table_name);
    console.log(`Found ${tableNames.length} tables in database`);

    // Truncate all tables
    if (tableNames.length > 0) {
      const tableIdentifiers = tableNames.map((name) =>
        sql.identifier(name as string),
      );
      await db.execute(
        sql`TRUNCATE TABLE ${sql.join(tableIdentifiers, sql`, `)} RESTART IDENTITY CASCADE`,
      );
    }

    console.log("✅ Database cleaned successfully!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
  }
}

async function seedCountries() {
  console.log("Seeding countries...");
  try {
    // Import Kaggle countries dataset
    const countriesData =
      await import("@/data/country-state-city/countries+states+cities+kaggle.json");
    const countries = uniqueByKey(
      (countriesData.default || countriesData) as CountryData[],
      (country) => country.name,
    );

    console.log(`Found ${countries.length} countries to seed`);

    // Create a map to store iso2 -> UUID mapping for lookups
    const countryIdMap = new Map<string, string>();

    // Batch insert for better performance
    const batchSize = 100;
    let processedCount = 0;
    let actuallyInsertedCount = 0;

    for (let i = 0; i < countries.length; i += batchSize) {
      const batch = countries.slice(i, i + batchSize);
      const countryValues = batch.map((country: CountryData) => ({
        name: country.name,
        iso3: country.iso3,
        iso2: country.iso2,
        phoneCode: country.phone_code, // Map phone_code to phoneCode
        capital: country.capital,
        currency: country.currency,
        region: country.region,
        subregion: country.subregion,
        latitude: country.latitude,
        longitude: country.longitude,
        emoji: country.emoji,
      }));

      // Use returning() to get the newly inserted IDs
      const insertedCountries = await db
        .insert(schema.appCountriesTable)
        .values(countryValues)
        .onConflictDoNothing()
        .returning({
          id: schema.appCountriesTable.id,
          iso2: schema.appCountriesTable.iso2,
        });

      // Map iso2 codes to new database UUIDs for lookup
      for (const insertedCountry of insertedCountries) {
        countryIdMap.set(insertedCountry.iso2, insertedCountry.id);
      }

      actuallyInsertedCount += insertedCountries.length;
      processedCount += batch.length;
      console.log(
        `Processed ${processedCount}/${countries.length} countries (${actuallyInsertedCount} newly inserted)`,
      );
    }

    console.log(
      `✅ Countries seeded successfully! Total processed: ${countries.length}, Newly inserted: ${actuallyInsertedCount}`,
    );
    return { countryIdMap, countriesData: countries };
  } catch (error) {
    console.error("❌ Error seeding countries:", error);
    throw error;
  }
}

async function seedStates(
  countryIdMap: Map<string, string>,
  countriesData: CountryData[],
) {
  console.log("Seeding states...");
  try {
    // Extract all states from countries data
    const allStates: Array<StateData & { country_iso2: string }> = [];
    for (const country of countriesData) {
      if (country.states && Array.isArray(country.states)) {
        for (const state of country.states) {
          allStates.push({
            ...state,
            country_iso2: country.iso2,
          });
        }
      }
    }

    const uniqueStates = uniqueByKey(
      allStates,
      (state) => `${state.country_iso2}:${state.name}`,
    );

    console.log(`Found ${uniqueStates.length} states to seed`);
    console.log(`Using ${countryIdMap.size} country ID mappings`);

    // Create a map to store state name+country_iso2 -> UUID mapping
    const stateIdMap = new Map<string, string>();

    // Batch insert for better performance
    const batchSize = 500;
    let processedCount = 0;
    let skippedCount = 0;
    let actuallyInsertedCount = 0;

    for (let i = 0; i < uniqueStates.length; i += batchSize) {
      const batch = uniqueStates.slice(i, i + batchSize);
      const stateValues = batch
        .filter((state: StateData & { country_iso2: string }) => {
          const hasMapping = countryIdMap.has(state.country_iso2);
          if (!hasMapping) skippedCount++;
          return hasMapping;
        })
        .map((state: StateData & { country_iso2: string }) => ({
          name: state.name,
          countryId: countryIdMap.get(state.country_iso2)!, // Use mapped country UUID
          latitude: state.latitude,
          longitude: state.longitude,
        }));

      if (stateValues.length > 0) {
        // Use returning() to get the newly inserted IDs
        const insertedStates = await db
          .insert(schema.appStatesTable)
          .values(stateValues)
          .onConflictDoNothing()
          .returning({
            id: schema.appStatesTable.id,
            name: schema.appStatesTable.name,
            countryId: schema.appStatesTable.countryId,
          });

        actuallyInsertedCount += insertedStates.length;

        // Map state name+country_iso2 to new database UUIDs
        for (let j = 0; j < batch.length; j++) {
          const originalState = batch[j] as StateData & {
            country_iso2: string;
          };
          if (countryIdMap.has(originalState.country_iso2)) {
            const mappedCountryId = countryIdMap.get(
              originalState.country_iso2,
            )!;
            const insertedState = insertedStates.find(
              (s) =>
                s.name === originalState.name &&
                s.countryId === mappedCountryId,
            );
            if (insertedState) {
              const stateKey = `${originalState.name}_${originalState.country_iso2}`;
              stateIdMap.set(stateKey, insertedState.id);
            }
          }
        }
      }

      processedCount += batch.length;
      console.log(
        `Processed ${processedCount}/${uniqueStates.length} states (${actuallyInsertedCount} newly inserted, ${skippedCount} skipped)`,
      );
    }

    console.log(
      `✅ States seeded successfully! Total processed: ${uniqueStates.length}, Newly inserted: ${actuallyInsertedCount}, Skipped: ${skippedCount}`,
    );
    return { stateIdMap, statesData: uniqueStates };
  } catch (error) {
    console.error("❌ Error seeding states:", error);
    throw error;
  }
}

async function seedCities(
  stateIdMap: Map<string, string>,
  countryIdMap: Map<string, string>,
  statesData: Array<StateData & { country_iso2: string }>,
) {
  console.log("Seeding cities...");
  try {
    // Extract all cities from states data
    const allCities: Array<
      CityData & { state_name: string; country_iso2: string }
    > = [];
    for (const state of statesData) {
      if (state.cities && Array.isArray(state.cities)) {
        for (const city of state.cities) {
          allCities.push({
            ...city,
            state_name: state.name,
            country_iso2: state.country_iso2,
          });
        }
      }
    }

    const uniqueCities = uniqueByKey(allCities, (city) => city.name);

    console.log(`Found ${uniqueCities.length} cities to seed`);

    const normalizeCityName = (name: string) => name.trim().toLowerCase();

    const existingCities = await db
      .select({
        name: schema.appCitiesTable.name,
      })
      .from(schema.appCitiesTable);

    const seenCityKeys = new Set(
      existingCities.map((city) => normalizeCityName(city.name)),
    );

    // Batch insert for better performance with larger batch size for cities
    const batchSize = 1000;
    let processedCount = 0;
    let skippedInvalidCount = 0;
    let skippedDuplicateCount = 0;
    let actuallyInsertedCount = 0;

    for (let i = 0; i < uniqueCities.length; i += batchSize) {
      const batch = uniqueCities.slice(i, i + batchSize);
      const cityValues = batch
        .filter(
          (city: CityData & { state_name: string; country_iso2: string }) => {
            const stateKey = `${city.state_name}_${city.country_iso2}`;
            const valid =
              stateIdMap.has(stateKey) && countryIdMap.has(city.country_iso2);
            if (!valid) skippedInvalidCount++;
            return valid;
          },
        )
        .map(
          (city: CityData & { state_name: string; country_iso2: string }) => {
            const stateKey = `${city.state_name}_${city.country_iso2}`;
            return {
              name: city.name,
              stateId: stateIdMap.get(stateKey)!, // Use mapped state UUID
              countryId: countryIdMap.get(city.country_iso2)!, // Use mapped country UUID
              latitude: city.latitude,
              longitude: city.longitude,
            };
          },
        )
        .filter((city) => {
          const cityKey = normalizeCityName(city.name);

          if (seenCityKeys.has(cityKey)) {
            skippedDuplicateCount++;
            return false;
          }

          seenCityKeys.add(cityKey);
          return true;
        });

      if (cityValues.length > 0) {
        const insertedCities = await db
          .insert(schema.appCitiesTable)
          .values(cityValues)
          .onConflictDoNothing()
          .returning({ id: schema.appCitiesTable.id });

        actuallyInsertedCount += insertedCities.length;
      }

      processedCount += batch.length;
      if (
        processedCount % 10000 === 0 ||
        processedCount === uniqueCities.length
      ) {
        console.log(
          `Processed ${processedCount}/${uniqueCities.length} cities (${actuallyInsertedCount} newly inserted, skipped invalid ${skippedInvalidCount}, duplicates ${skippedDuplicateCount})`,
        );
      }
    }

    console.log(
      `✅ Cities seeded successfully! Total processed: ${uniqueCities.length}, Newly inserted: ${actuallyInsertedCount}, Skipped invalid: ${skippedInvalidCount}, Duplicates: ${skippedDuplicateCount}`,
    );
  } catch (error) {
    console.error("❌ Error seeding cities:", error);
    throw error;
  }
}

async function seedLanguages() {
  console.log("Seeding languages...");

  for (const language of uniqueByKey(
    languageData,
    (language) => language.name,
  )) {
    await db
      .insert(schema.appLanguagesTable)
      .values({
        name: language.name,
      })
      .onConflictDoNothing();
  }

  console.log("✅ All languages seeded successfully.");
}

async function seedTimezones() {
  console.log("Seeding timezones...");

  for (const offset of uniqueStrings([...UTC_OFFSETS])) {
    // Extract raw offset: "UTC+5:30" -> "+5:30", "UTC-12" -> "-12", "UTC+0" -> "+0"
    const rawOffset = offset.replace("UTC", "") || "+0";

    await db
      .insert(schema.appTimezonesTable)
      .values({ name: offset, utcOffset: rawOffset, label: offset })
      .onConflictDoNothing();
  }

  console.log("✅ All timezones seeded successfully.");
}

async function seedAll() {
  try {
    // console.log("Starting database seeding...");
    await cleanDatabase();

    // Seed geographic data first (countries -> states -> cities)
    // IMPORTANT: Each function returns ID mappings to maintain proper relationships
    const { countryIdMap, countriesData } = await seedCountries();
    const { stateIdMap, statesData } = await seedStates(
      countryIdMap,
      countriesData,
    );
    await seedCities(stateIdMap, countryIdMap, statesData);

    // Then seed user management data
    await seedPermissions();
    await seedRoles();
    await seedPermissionToRoles();
    await seedUsers();
    await seedLanguages();
    await seedTimezones();
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    throw error;
  }
}

const handleError = (error: Error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
};

if (require.main === module) {
  seedAll()
    .catch(handleError)
    .finally(() => process.exit(0));
}
