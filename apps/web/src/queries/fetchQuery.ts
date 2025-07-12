import { queryOptions, useQuery } from "@tanstack/solid-query";
import type { s } from "@wetarseel/db-types";
type TableName = s.Table;
export const fetchQuery = <T extends TableName>(
  queryKey: string[],
  url: string
) => {
  const tableQueryOptions = queryOptions({
    queryKey,
    queryFn: async (): Promise<s.SelectableForTable<T>[]> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const query = useQuery(() => tableQueryOptions);

  return query;
};
