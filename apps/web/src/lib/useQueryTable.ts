// src/lib/useQueryTable.ts
import { queryOptions, useQuery } from "@tanstack/solid-query";
import type { s } from "@wetarseel/db-types";

// Use the correct Table type from Zapatos schema
type TableName = s.Table;

type FetchOptions = {
  filter?: string;
  expand?: string;
  limit?: number;
};

export function dbquery<T extends TableName>(
  table: T,
  opts: FetchOptions = {}
) {
  // Create query options using the modern API
  const tableQueryOptions = queryOptions({
    queryKey: [table, opts],
    queryFn: async (): Promise<s.SelectableForTable<T>[]> => {
      const params = new URLSearchParams();
      if (opts.filter) params.set("filter", opts.filter);
      if (opts.expand) params.set("expand", opts.expand);
      if (opts.limit) params.set("limit", String(opts.limit));

      const url = `/api/items/${table}?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(await res.text());

      return res.json();
    },
  });

  // Use the query options with useQuery - this should now properly infer types
  const query = useQuery(() => tableQueryOptions);

  return query;
}
