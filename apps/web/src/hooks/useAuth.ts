import { useQuery } from "@tanstack/solid-query";
import { authClient } from "@/lib/auth-client";

export const useAuth = () => {
  return useQuery(() => ({
    queryKey: ["auth"],
    queryFn: async () => {
      const session = await authClient.getSession();
      if (!session?.data?.user?.email) {
        throw new Error("Not authenticated");
      }
      return session.data.user;
    },
  }));
};
