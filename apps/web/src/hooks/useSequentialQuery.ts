// Create a new file: hooks/useSequentialQuery.ts
import { createSignal, createEffect, createMemo } from "solid-js";
import { dbquery } from "@/lib/useQueryTable";

export function useSequentialConversations() {
  const [loadLarge, setLoadLarge] = createSignal(false);

  // Initial small query
  const smallQuery = dbquery(
    "conversations",
    {
      expand: "from.leads,message.messages",
      limit: 10,
    },
    () => [],
    {
      enabled: () => true,
    }
  );

  // Large query triggered after small one succeeds
  const largeQuery = dbquery(
    "conversations",
    {
      expand: "from.leads,message.messages",
      limit: 100000,
    },
    () => [],
    {
      enabled: () => loadLarge(),
    }
  );

  // Trigger large query when small one succeeds
  createEffect(() => {
    if (smallQuery().isSuccess && smallQuery().data) {
      console.log("✅ Initial 10 conversations loaded, loading 1000...");
      setTimeout(() => setLoadLarge(true), 0);
    }
  });

  // Return the appropriate query
  const activeQuery = createMemo(() => {
    const large = largeQuery();
    if (large.isSuccess && large.data) {
      console.log("✅ All 1000 conversations loaded");
      return large;
    }
    return smallQuery();
  });

  return {
    query: activeQuery,
    isLoadingInitial: () => smallQuery().isPending,
    isLoadingAll: () => largeQuery().isPending,
    hasLoadedAll: () => largeQuery().isSuccess,
  };
}
