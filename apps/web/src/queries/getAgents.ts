import { queryOptions, useQuery } from "@tanstack/solid-query";

export const getAgents = () => {
  const tableQueryOptions = queryOptions({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/accounts/users");
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const query = useQuery(() => tableQueryOptions);

  return query;
};
