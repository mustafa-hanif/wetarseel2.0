// Load environment variables first
import "dotenv/config";

import { getAccountFromUser } from "queries/getAccountFromUser";
import { auth } from "./auth";
import { db, type s, pool } from "./db";
import { migrateUsers } from "./migrate-users";
import items from "./routes/items";
import mutations from "./routes/mutations"; // Add this import
import { whatsappConsumer } from "./src/services/whatsapp-consumer";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { LRUCache } from "lru-cache";

// Enhanced logging utility
const logger = {
  info: (message: string, meta?: any) => {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  warn: (message: string, meta?: any) => {
    console.warn(
      `[WARN] ${new Date().toISOString()} - ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        meta ? JSON.stringify(meta) : ""
      );
    }
  },
};

export const cache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 60,
});

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

app.use(
  "/api/*", // Enable CORS for all API routes
  cors({
    origin: process.env.FRONTEND_URL || "https://uae.wetarseel.ai", // replace with your origin
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use("*", async (c, next) => {
  if (c.req.path === "/health") {
    return next();
  }
  let session;
  if (cache.has(JSON.stringify(c.req.raw.headers.toJSON()))) {
    logger.debug("session cache hit");
    session = JSON.parse(
      cache.get(JSON.stringify(c.req.raw.headers.toJSON())) as string
    );
  } else {
    session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (session?.user?.email) {
      const account = await getAccountFromUser(session.user.email);
      session.user.accountId = account?.id ?? "";
    }
    cache.set(
      JSON.stringify(c.req.raw.headers.toJSON()),
      JSON.stringify(session)
    );
  }
  // console.log({ session });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.on(["GET", "POST", "PUT", "DELETE"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.on(["GET", "POST", "PUT", "DELETE"], "/api/items/**", async (c) => {
  const user = c.get("user");
  // Optional: Check authentication
  if (!user || !user?.accountId) {
    console.log("here", user);
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const response = await items.fetch(c.req.raw, user.accountId);
    return response;
  } catch (error) {
    logger.error("Error handling items request:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.on(["POST", "PUT", "DELETE"], "/api/mutations/**", async (c) => {
  const user = c.get("user");
  let skipAccountCheck = false;
  if (c.req.query("skipAccountCheck") === "true") {
    skipAccountCheck = true;
  }
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const response = await mutations.fetch(
      c.req.raw,
      user?.accountId ?? "",
      skipAccountCheck
    );
    return response;
  } catch (error) {
    logger.error("Error handling mutation request:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Get all users for a specific account
app.get("/api/accounts/users", async (c) => {
  const user = c.get("user");

  if (!user || !user?.accountId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const accountId = user.accountId;
  try {
    // Using db.select with custom SQL condition for JSON array check
    const usersInAccount = await db
      .select(
        "users",
        db.sql`id = ANY(
        SELECT json_array_elements_text(pb_user_id)
        FROM accounts 
        WHERE id = ${db.param(accountId)}
      )`
      )
      .run(pool);

    return c.json(usersInAccount);
  } catch (error) {
    logger.error("Error fetching users for account:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/", (c) => c.text("Welcome to the API!"));
app.get("/health", (c) => c.text("API is healthy!"));
app.get("/hello", (c) => {
  migrateUsers();
  return c.text("Hello World!");
});

// Monitoring dashboard
app.get("/monitoring", async (c) => {
  const html = await Bun.file("./monitoring.html").text();
  return c.html(html);
});

// const server = Bun.serve({
//   port: 4000,
//   routes: {
//     "/": () => new Response("Welcome to the API!"),
//     "/health": () => new Response("API is healthy!"),
//     "/api/auth/*": async (req: Request) => {
//       const a = await auth.handler(req);
//       return new Response(a.body, {
//         status: a.status,
//         headers: {
//           ...a.headers,
//           "Access-Control-Allow-Origin": "*",
//         },
//       });
//     },
//     "/api/items/*": async (req: Request) => {
//       return items.fetch(req);
//     },
//     "/hello": () => {
//       migrateUsers();
//       return new Response("Hello World!");
//     },
//   },
// });

// Start WhatsApp SQS consumer
try {
  whatsappConsumer.start();
  logger.info("WhatsApp SQS consumer started successfully");
} catch (error) {
  logger.error("Failed to start WhatsApp SQS consumer:", error);
}

// Add WhatsApp consumer status endpoint
app.get("/api/whatsapp/status", (c) => {
  const status = whatsappConsumer.getStatus();
  return c.json({
    whatsappConsumer: status,
    timestamp: new Date().toISOString(),
  });
});

logger.info("API server started", {
  port: 4000,
  environment: process.env.NODE_ENV || "development",
});
export default {
  port: 4000,
  fetch: app.fetch,
};
