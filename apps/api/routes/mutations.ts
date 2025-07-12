import { db, type s, pool } from "../db";

type MutationType = "create" | "update" | "delete";

interface MutationPayload {
  operation: MutationType;
  table: string;
  data?: Record<string, any>;
  where?: Record<string, any>;
  id?: string;
}

export default {
  async fetch(
    req: Request,
    accountId: string,
    skipAccountCheck: boolean = false
  ) {
    const url = new URL(req.url);
    const method = req.method;

    try {
      let payload: MutationPayload;

      // Handle different HTTP methods
      if (method === "POST" || method === "PUT" || method === "DELETE") {
        if (method === "DELETE") {
          // For DELETE, extract table and id from URL path
          const [, , , table, id] = url.pathname.split("/"); // /mutations/:table/:id
          if (!table) {
            return new Response(
              JSON.stringify({ error: "Table required for delete" }),
              {
                status: 400,
              }
            );
          }
          payload = {
            operation: "delete",
            table,
            id,
          };
        } else {
          // For POST/PUT, get payload from request body
          const body = (await req.json()) as MutationPayload;
          payload = body;
        }
      } else {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
        });
      }

      const { operation, table, data, where, id } = payload;

      // Validate table name
      if (typeof table !== "string") {
        return new Response(JSON.stringify({ error: "Invalid table name" }), {
          status: 400,
        });
      }

      // Add account_id to data for account isolation
      let accountData = data ? { ...data, account_id: accountId } : {};
      if (skipAccountCheck) {
        accountData = data ?? {};
      }
      let result;

      switch (operation) {
        case "create": {
          if (!data) {
            return new Response(
              JSON.stringify({ error: "Data required for create operation" }),
              { status: 400 }
            );
          }

          const query = db.sql`
            INSERT INTO ${db.raw(table)} 
            (${db.raw(Object.keys(accountData).join(", "))})
            VALUES (${db.vals(Object.values(accountData))})
            RETURNING *
          `;

          const rows = await query.run(pool);
          result = rows[0];
          break;
        }

        case "update": {
          if (!data || (!where && !id)) {
            return new Response(
              JSON.stringify({
                error: "Data and where condition or id required for update",
              }),
              { status: 400 }
            );
          }

          if (id) {
            // Update by ID
            const setClause = Object.keys(accountData)
              .map((key) => `${key} = ${db.param((accountData as any)[key])}`)
              .join(", ");

            const query = db.sql`
              UPDATE ${db.raw(table)} 
              SET ${db.raw(setClause)}
              WHERE id = ${db.param(id)} AND account_id = ${db.param(accountId)}
              RETURNING *
            `;
            const rows = await query.run(pool);
            result = rows[0];
          } else if (where) {
            // Update by where conditions
            const setClause = Object.keys(accountData)
              .map((key) => `${key} = ${db.param((accountData as any)[key])}`)
              .join(", ");

            const whereClause = Object.keys(where)
              .map((key) => `${key} = ${db.param((where as any)[key])}`)
              .join(" AND ");

            const query = db.sql`
              UPDATE ${db.raw(table)} 
              SET ${db.raw(setClause)}
              WHERE ${db.raw(whereClause)} AND account_id = ${db.param(accountId)}
              RETURNING *
            `;

            const rows = await query.run(pool);
            result = rows[0];
          }
          break;
        }

        case "delete": {
          if (!id && !where) {
            return new Response(
              JSON.stringify({
                error: "ID or where condition required for delete",
              }),
              { status: 400 }
            );
          }

          if (id) {
            const query = db.sql`
              DELETE FROM ${db.raw(table)}
              WHERE id = ${db.param(id)} AND account_id = ${db.param(accountId)}
              RETURNING *
            `;
            const rows = await query.run(pool);
            result = rows[0];
          } else if (where) {
            const whereClause = Object.keys(where)
              .map((key) => `${key} = ${db.param((where as any)[key])}`)
              .join(" AND ");

            const query = db.sql`
              DELETE FROM ${db.raw(table)}
              WHERE ${db.raw(whereClause)} AND account_id = ${db.param(accountId)}
              RETURNING *
            `;

            const rows = await query.run(pool);
            result = rows[0];
          }
          break;
        }

        default:
          return new Response(JSON.stringify({ error: "Invalid operation" }), {
            status: 400,
          });
      }

      if (!result && operation !== "delete") {
        return new Response(JSON.stringify({ error: "Operation failed" }), {
          status: 400,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          operation,
          data: result,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Mutation error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
      });
    }
  },
};
