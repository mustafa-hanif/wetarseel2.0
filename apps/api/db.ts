// db.ts
import * as db from "zapatos/db";
import type * as s from "zapatos/schema";
import { pool } from "./pool";

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
