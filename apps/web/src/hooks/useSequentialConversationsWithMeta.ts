import { createSignal, createEffect, createMemo } from "solid-js";
import { queryOptions, useQuery } from "@tanstack/solid-query";

interface ConversationQueryParams {
  userId: string;
  filter?: "all" | "assigned" | "unread";
  limit?: number;
}

// Query options factory for conversations with metadata
function conversationsQueryOptions(params: ConversationQueryParams) {
  return queryOptions({
    queryKey: ["conversations", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        userId: params.userId,
        filter: params.filter || "all",
        limit: (params.limit || 50).toString(),
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/conversations?${searchParams.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch conversations: ${res.status}`);
      }

      const result = await res.json();
      return result.conversations || [];
    },
    enabled: !!params.userId, // Only run when we have a valid userId
  });
}

export function useSequentialConversations(userId: string) {
  const [loadLarge, setLoadLarge] = createSignal(false);

  // Initial small query with metadata
  const smallQuery = useQuery(() => ({
    ...conversationsQueryOptions({
      userId,
      filter: "all",
      limit: 10,
    }),
    enabled: true, // !loadLarge() && !!userId, // Enable when small query succeeds and we have userId
  }));

  // Large query triggered after small one succeeds
  const largeQuery = useQuery(() => ({
    ...conversationsQueryOptions({
      userId,
      filter: "all",
      limit: 100000,
    }),
    enabled: loadLarge() && !!userId, // Enable when small query succeeds and we have userId
  }));

  // Enable large query when small one succeeds
  createEffect(() => {
    if (smallQuery.isSuccess && smallQuery.data) {
      setTimeout(() => setLoadLarge(true), 0);
    }
  });

  // Return the appropriate query
  const activeQuery = createMemo(() => {
    if (largeQuery.isSuccess && largeQuery.data && loadLarge()) {
      console.log("Using large query");
      return largeQuery;
    }
    console.log("Using small query");
    return smallQuery;
  });

  return {
    query: activeQuery,
    isLoadingInitial: () => smallQuery.isPending,
    isLoadingAll: () => largeQuery.isPending,
    hasLoadedAll: () => largeQuery.isSuccess,
  };
}
