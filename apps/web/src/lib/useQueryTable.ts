// src/lib/useQueryTable.ts
import { QueryOptions, queryOptions, useQuery } from "@tanstack/solid-query";
import type { s } from "@wetarseel/db-types";
import { createMemo } from "solid-js";

// Use the correct Table type from Zapatos schema
type TableName = s.Table;

type FetchOptions = {
  filter?: string;
  expand?: string;
  limit?: number;
};

type AdditionalQueryOptions = {
  enabled?: () => boolean;
  staleTime?: () => number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number | boolean;
  // Add other TanStack Query options as needed
};

export function dbquery<T extends TableName>(
  table: T,
  opts: FetchOptions | (() => FetchOptions) = {},
  deps: () => any[] = () => [], // New deps parameter - function that returns array of dependencies
  moreQueryOptions: AdditionalQueryOptions = {} // Properly type this
) {
  return createMemo(() => {
    // Call deps() to establish reactive dependency
    const currentDeps = deps();
    const currentOpts = typeof opts === "function" ? opts() : opts;

    // Create fresh query options with current deps in the key
    const tableQueryOptions = queryOptions({
      queryKey: [table, opts, currentDeps],
      queryFn: async (): Promise<s.SelectableForTable<T>[]> => {
        const params = new URLSearchParams();
        if (currentOpts.filter) params.set("filter", currentOpts.filter);
        if (currentOpts.expand) params.set("expand", currentOpts.expand);
        if (currentOpts.limit) params.set("limit", String(currentOpts.limit));

        const url = `/api/items/${table}?${params.toString()}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error(await res.text());

        return res.json();
      },
      ...(moreQueryOptions.enabled && {
        enabled: moreQueryOptions.enabled(),
      }),

      ...(moreQueryOptions.staleTime && {
        staleTime: moreQueryOptions.staleTime(),
      }),
    });

    return useQuery(() => tableQueryOptions);
  });
}
