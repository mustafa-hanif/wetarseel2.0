// db.ts
import * as db from "zapatos/db";
import type * as s from "zapatos/schema";
import { Pool } from "pg";

// Disable SSL verification globally for Node.js (development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.ZAPATOS_DB_URL,
});

export { db, pool };
export type { s };
