import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema/index";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // max number of connections in the pool
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail if a connection cannot be established in 2s
});

export const db = drizzle(pool, { schema, logger: false });

/** Call this in test cleanup to release the pool's internal timers. */
export const closeDbPool = () => pool.end();
