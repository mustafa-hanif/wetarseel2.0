// expand.ts
import { db, type s, pool } from "./db";

// example, I want to expand the "from" key in conversation, which is a row of leads
// I will put "from.leads"
export async function expand<T extends keyof s.Table>(
  table: T,
  rows: s.Selectable[],
  expandParam: string
) {
  const expansions = expandParam.split(",").map((e) => e.trim());
  const result = [...rows];

  for (const path of expansions) {
    // from leads
    const [field, foreignTable] = path.split(".");

    // Check if field is a foreign key on this table
    const fk = field as keyof s.Selectable;

    for (const row of result) {
      const fkId = row[fk];
      if (!fkId) continue;

      if (!field) continue;

      const related = await db
        .select(foreignTable as any, { id: fkId })
        .run(pool);

      (row as any)[field] = related[0];

      // Sub-expand if nested
      // if (subfield && related[0]) {
      //   (row as any)[field] = await expand(
      //     foreignTable as any,
      //     [related[0]],
      //     subfield
      //   );
      // }
    }
  }

  return result;
}

function guessForeignTable(field: string): string {
  // crude: guess foreign table by stripping `_id` or using field name
  if (field.endsWith("_id")) return field.replace(/_id$/, "");
  return field;
}
