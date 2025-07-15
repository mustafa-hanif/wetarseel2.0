import { queryOptions, useQuery } from "@tanstack/solid-query";

export const getAgents = () => {
  const tableQueryOptions = queryOptions({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/accounts/users`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const query = useQuery(() => tableQueryOptions);

  return query;
};
