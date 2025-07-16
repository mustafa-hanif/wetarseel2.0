// db.ts
import * as db from "zapatos/db";
import type * as s from "zapatos/schema";
import { Pool } from "pg";

// Disable SSL verification globally for Node.js (development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.ZAPATOS_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Enable query logging for development
  ...(process.env.NODE_ENV === "development" && {
    log: (message: string) => {
      console.log("🔍 PostgreSQL Log:", message);
    },
  }),
});

// Optional: Add connection event listeners for debugging
if (process.env.NODE_ENV === "development") {
  pool.on("connect", (client) => {
    console.log("📡 PostgreSQL client connected");
  });

  pool.on("error", (err) => {
    console.error("❌ PostgreSQL pool error:", err);
  });
}

export { db, pool };
export type { s };
