// routes/items.ts
import { db, type s, pool } from "../db";
import { expand } from "../expand";

export default {
  async fetch(req: Request, accountId: string) {
    const url = new URL(req.url);
    const [, , , table] = url.pathname.split("/"); // /items/:table
    const expandParam = url.searchParams.get("expand") || "";
    const filterParam = url.searchParams.get("filter") || "";
    const limit = parseInt(url.searchParams.get("limit") || "1000");

    // if (typeof table !== "string" || !allowedTables.includes(table)) {
    if (typeof table !== "string") {
      return new Response(JSON.stringify({ error: "Invalid table" }), {
        status: 400,
      });
    }

    const filters = filterParam.split(",").map((e) => e.trim());
    const [columnName, operation, value] = (filters?.[0] ?? "").split(".");
    console.log(filters, columnName, value);
    const expansions = expandParam.split(",").map((e) => e.trim());

    // Build conditional query using Zapatos SQL builder
    let whereConditions = db.sql`${db.raw(table)}.account = ${db.param(accountId)}`;

    if (filters.length > 0 && columnName && value) {
      whereConditions = db.sql`${whereConditions} AND ${db.raw(table)}.${db.raw(columnName)} = ${db.param(value)}`;
    }
    console.log(whereConditions.compile());

    // Build the query with optional JOIN
    // Build the query with optional JOIN
    let query;
    if (expansions.length > 0 && expansions[0]) {
      // Build SELECT clause with all expansions
      let selectClause = db.sql`${db.raw(table)}.*`;
      let joinClause = db.sql``;

      // Add each expansion as a separate JOIN and SELECT field
      for (const expansion of expansions) {
        if (!expansion) continue;

        const [field, foreignTable] = expansion.split(".");
        if (!field || !foreignTable) continue;

        // Add the foreign table data as JSON
        selectClause = db.sql`${selectClause},
          CASE 
            WHEN ${db.raw(foreignTable)}.id IS NOT NULL 
            THEN row_to_json(${db.raw(foreignTable)}.*)
            ELSE NULL
          END as ${db.raw(foreignTable)}`;

        // Add LEFT JOIN for this expansion
        joinClause = db.sql`${joinClause}
          LEFT JOIN ${db.raw(foreignTable)} ON ${db.raw(table)}.${db.raw(field)} = ${db.raw(foreignTable)}.id`;
      }

      query = db.sql`
        SELECT ${selectClause}
        FROM ${db.raw(table)}
        ${joinClause}
        WHERE ${whereConditions}
        ORDER BY ${db.raw(table)}.updated DESC
        LIMIT ${db.param(limit)}
      `;
    } else {
      query = db.sql`
        SELECT * FROM ${db.raw(table)}
        WHERE ${whereConditions}
        ORDER BY ${db.raw(table)}.updated DESC
        LIMIT ${db.param(limit)}
      `;
    }

    const rows = await query.run(pool);

    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
