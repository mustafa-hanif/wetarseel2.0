// routes/items.ts
import { db, type s, pool } from "../db";
import { expand } from "../expand";

export default {
  async fetch(req: Request) {
    const url = new URL(req.url);
    const [, , , table] = url.pathname.split("/"); // /items/:table
    const expandParam = url.searchParams.get("expand");
    const filterParam = url.searchParams.get("filter") || "";
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const allowedTables = ["users", "posts", "comments"];
    // if (typeof table !== "string" || !allowedTables.includes(table)) {
    if (typeof table !== "string") {
      return new Response(JSON.stringify({ error: "Invalid table" }), {
        status: 400,
      });
    }

    const query = db.sql`
      SELECT * FROM ${db.raw(table)} 
      WHERE name ILIKE ${db.param("%" + filterParam + "%")}
      LIMIT ${db.param(limit)}
    `;

    const rows = await query.run(pool);

    const result = expandParam
      ? await expand(table as keyof s.Table, rows, expandParam)
      : rows;

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
