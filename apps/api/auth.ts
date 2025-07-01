import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["http://localhost:3000"],
  database: new Pool({
    // connection options
    host: "ep-dark-snow-a1vvbr1z-pooler.ap-southeast-1.aws.neon.tech",
    user: "neondb_owner",
    password: "npg_rCGW9gesKxZ4",
    database: "neondb",
    ssl: true,
  }),
});
