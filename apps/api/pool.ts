import { Pool } from "pg";
// Disable SSL verification globally for Node.js (development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Create a connection pool
export const pool = new Pool({
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